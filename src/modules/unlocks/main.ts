import { input, select } from '@inquirer/prompts';
import fsExtra from 'fs-extra';
import { tmpdir } from 'os';
import { basename, join } from 'path';
import pColors from 'picocolors';
import { Readable } from 'stream';
import { extract } from 'zip-lib';
import { getTranslatedLabel } from '../../common/dictionary/main.js';
import { itlUser } from '../../common/login/main.js';
import { api, eventName, maxDownloadAttempts } from '../../common/settings.js';
import { EventUnlock, UnlocksSaveMethod } from './types.js';

export async function manageUnlocks() {
    console.log(pColors.blue(getTranslatedLabel('unlocks.checking')));

    const downloadableUnlocks = await getUnlocksList();

    if (!downloadableUnlocks.length) {
        console.log(
            pColors.yellow(getTranslatedLabel('unlocks.noneDownloadable')),
        );
        return;
    }

    console.log(
        pColors.cyan(
            getTranslatedLabel('unlocks.downloadableCount', {
                NUMDOWNLOAD: downloadableUnlocks?.length?.toString() || '0',
            }),
        ),
    );
    console.log(''); // space

    const saveMethod: UnlocksSaveMethod = await getSaveMethod();
    const unlocksDestPath = await getUnlocksDestPath();

    const tempDownloadPath = await getTempDownloadPath();
    let unlocksDownloaded = 0;
    for (const unlock of downloadableUnlocks) {
        const zipPath = await getUnlockZip(unlock, tempDownloadPath);

        if (!zipPath) {
            console.log(
                pColors.red(
                    getTranslatedLabel('unlocks.downloadDefError', {
                        CHAINTITLE: unlock.title,
                        PLAYSTYLE: unlock.playStyle,
                    }),
                ),
            );
        } else {
            await extract(zipPath, tempDownloadPath);
            await fsExtra.rm(zipPath);

            unlocksDownloaded++;
            console.log(
                pColors.gray(
                    getTranslatedLabel('unlocks.downloadSuccess', {
                        CHAINTITLE: unlock.title,
                        PLAYSTYLE: unlock.playStyle,
                    }),
                ),
            );
        }
    }

    console.log(''); // space
    console.log(
        pColors.cyan(
            getTranslatedLabel('unlocks.downloadDone', {
                UNLOCKSDOWNLOADED: unlocksDownloaded.toString(),
                TOTALUNLOCKS: downloadableUnlocks.length.toString(),
            }),
        ),
    );

    if (saveMethod === 'overwrite') {
        await fsExtra.copy(tempDownloadPath, unlocksDestPath);

        console.log(pColors.green(getTranslatedLabel('unlocks.overwriteDone')));
    } else {
        const alreadySavedUnlocks = await fsExtra.readdir(unlocksDestPath);
        if (!alreadySavedUnlocks.length) {
            await fsExtra.copy(tempDownloadPath, unlocksDestPath);

            console.log(
                pColors.green(getTranslatedLabel('unlocks.overwriteDone')),
            );
        } else {
            const justDownloadedUnlocks =
                await fsExtra.readdir(tempDownloadPath);

            for (const unlockFolder of justDownloadedUnlocks) {
                const folderExists = alreadySavedUnlocks.find(
                    (f) => f === unlockFolder,
                );

                if (!folderExists) {
                    const tempUnlockPath = join(tempDownloadPath, unlockFolder);
                    const destUnlockPath = join(unlocksDestPath, unlockFolder);

                    await fsExtra.copy(tempUnlockPath, destUnlockPath);
                    console.log(
                        pColors.green(
                            getTranslatedLabel('unlocks.overwriteDone', {
                                FOLDERNAME: unlockFolder,
                            }),
                        ),
                    );
                }
            }
        }
    }

    // delete temp path
    await fsExtra.rm(tempDownloadPath, { recursive: true });
}

async function getUnlocksList() {
    const resp = await fetch(`${api.baseUrl}${api.routes.unlocks}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Cookie: itlUser.cookie,
        },
    });

    if (!resp.ok) return [];

    const jsonResp = await resp.json();
    const apiResp = jsonResp as { [key: string]: any };

    // double check
    if (!apiResp.success) return [];

    const downloadableUnlocks: EventUnlock[] = [];
    const unlockData = apiResp?.data;

    unlockData.forEach((unlock: any) => {
        if (unlock.downloadLink) {
            downloadableUnlocks.push({
                title: unlock?.title,
                downloadLink: unlock?.downloadLink,
                playStyle: unlock?.playstyle === 2 ? 'DOUBLE' : 'SINGLE',
            });
        }
    });

    return downloadableUnlocks;
}

async function getSaveMethod() {
    const saveMethod = await select({
        message: getTranslatedLabel('unlocks.saveMethod.question'),
        choices: [
            {
                name: getTranslatedLabel('unlocks.saveMethod.diff.title'),
                value: 'diff',
                description: getTranslatedLabel(
                    'unlocks.saveMethod.diff.description',
                ),
            },
            {
                name: getTranslatedLabel('unlocks.saveMethod.overwrite.title'),
                value: 'overwrite',
                description: getTranslatedLabel(
                    'unlocks.saveMethod.overwrite.description',
                ),
            },
        ],
    });

    return saveMethod as UnlocksSaveMethod;
}

async function getUnlocksDestPath() {
    const destPath = await input({
        message: getTranslatedLabel('unlocks.destinationPath'),
        default: process.cwd(),
        validate: async (value) => await fsExtra.exists(value),
    });

    // check if dest path is already an unlocks folder
    // otherwise create
    if (!basename(destPath).includes(`${eventName} Unlocks`)) {
        const unlocksUserFolderPath = join(
            destPath,
            `${eventName} Unlocks - ${itlUser.name}`,
        );
        const existsUnlocksFolder = await fsExtra.exists(unlocksUserFolderPath);
        if (!existsUnlocksFolder) await fsExtra.mkdir(unlocksUserFolderPath);

        return unlocksUserFolderPath;
    }

    return destPath;
}

async function getTempDownloadPath() {
    const tempDownloadPath = join(
        tmpdir(),
        `${eventName.replace(/\s/g, '_')}_unlocks_download`,
    );
    const existsTemp = await fsExtra.exists(tempDownloadPath);

    if (existsTemp) await fsExtra.rm(tempDownloadPath, { recursive: true });

    await fsExtra.mkdir(tempDownloadPath);
    return tempDownloadPath;
}

async function getUnlockZip(unlock: EventUnlock, unlocksFolderPath: string) {
    let attempts = 0;
    let zipPath = null;

    while (attempts < maxDownloadAttempts) {
        zipPath = await downloadUnlockZip(
            unlock.downloadLink,
            unlocksFolderPath,
        );

        if (zipPath) {
            // exit now
            attempts = maxDownloadAttempts;
        } else {
            attempts++;
            console.log(
                pColors.red(
                    getTranslatedLabel('unlocks.downloadAttemptError', {
                        CHAINTITLE: unlock.title,
                        PLAYSTYLE: unlock.playStyle,
                        ATTEMPTCOUNT: (attempts + 1).toString(),
                        MAXATTEMPTS: maxDownloadAttempts.toString(),
                    }),
                ),
            );
        }
    }

    return zipPath;
}

async function downloadUnlockZip(
    downloadLink: string,
    unlocksDownloadPath: string,
) {
    const resp = await fetch(downloadLink);

    if (!resp.ok) return null;

    const zipName = basename(downloadLink);
    const zipPath = join(unlocksDownloadPath, zipName);

    await new Promise((resolve, reject) => {
        const nodeReadable = Readable.fromWeb(resp.body as any);
        const destFileStream = fsExtra.createWriteStream(zipPath);

        let bytesDownloaded = 0;

        nodeReadable.on('data', (chunk: Buffer) => {
            bytesDownloaded += chunk.length;
        });

        nodeReadable.pipe(destFileStream);

        destFileStream.on('finish', resolve);
        destFileStream.on('error', reject);
    });

    return zipPath;
}
