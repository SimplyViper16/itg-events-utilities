import { input, select } from '@inquirer/prompts';
import { copy, createWriteStream, exists, mkdir, readdir, rm } from 'fs-extra';
import { basename, join } from 'path';
import { blue, cyan, gray, green, red, yellow } from 'picocolors';
import { pipeline } from 'stream';
import { promisify } from 'util';
import { extract } from 'zip-lib';
import { dictionary, language } from './dictionary';
import { EventUnlock, SaveMethod } from '../common/types';
import {
	apiRoutes,
	eventName,
	maxDownloadAttempts,
	siteUrl,
} from '../common/settings';
import { itlUser } from '../common/login';

const streamPipeline = promisify(pipeline);

export async function manageUnlocks() {
	const unlocksDictionary = dictionary[language].unlocks;

	console.log(blue(unlocksDictionary.checking));

	const downloadableUnlocks = await getUnlocksList();

	if (!downloadableUnlocks.length) {
		console.log(yellow(unlocksDictionary.noneDownloadable));
		return;
	}

	console.log(
		cyan(unlocksDictionary.downloadableCount).replace(
			'#NUMDOWNLOAD#',
			downloadableUnlocks.length.toString()
		)
	);
	console.log(''); // space

	const saveMethod: SaveMethod = await getSaveMethod();
	const unlocksDestPath = await getUnlocksDestPath();

	const tempDownloadPath = await getTempDownloadPath();
	let unlocksDownloaded = 0;
	for (const unlock of downloadableUnlocks) {
		const zipPath = await getUnlockZip(unlock, tempDownloadPath);

		if (!zipPath) {
			console.log(
				red(unlocksDictionary.downloadDefError)
					.replace('#CHAINTITLE#', unlock.title)
					.replace('#PLAYSTYLE#', unlock.playStyle)
			);
		} else {
			await extract(zipPath, tempDownloadPath);
			await rm(zipPath);

			unlocksDownloaded++;
			console.log(
				gray(unlocksDictionary.downloadSuccess)
					.replace('#CHAINTITLE#', unlock.title)
					.replace('#PLAYSTYLE#', unlock.playStyle)
			);
		}
	}

	console.log(''); // space
	console.log(
		cyan(unlocksDictionary.downloadDone)
			.replace('#UNLOCKSDOWNLOADED#', unlocksDownloaded.toString())
			.replace('#TOTALUNLOCKS#', downloadableUnlocks.length.toString())
	);

	if (saveMethod === 'overwrite') {
		await copy(tempDownloadPath, unlocksDestPath);

		console.log(green(unlocksDictionary.overwriteDone));
	} else {
		const alreadySavedUnlocks = await readdir(unlocksDestPath);
		if (!alreadySavedUnlocks.length) {
			await copy(tempDownloadPath, unlocksDestPath);

			console.log(green(unlocksDictionary.overwriteDone));
		} else {
			const justDownloadedUnlocks = await readdir(tempDownloadPath);

			for (const unlockFolder of justDownloadedUnlocks) {
				const folderExists = alreadySavedUnlocks.find(
					(f) => f === unlockFolder
				);

				if (!folderExists) {
					const tempUnlockPath = join(tempDownloadPath, unlockFolder);
					const destUnlockPath = join(unlocksDestPath, unlockFolder);

					await copy(tempUnlockPath, destUnlockPath);
					console.log(
						green(unlocksDictionary.diffDone).replace(
							'#FOLDERNAME#',
							unlockFolder
						)
					);
				}
			}
		}
	}

	// delete temp path
	await rm(tempDownloadPath, { recursive: true });
}

async function getUnlocksList() {
	const resp = await fetch(`${siteUrl}${apiRoutes.unlocks}`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			Cookie: itlUser.cookie,
		},
	});

	if (!resp.ok) return [];

	const apiResp = await resp.json();
	// double check
	if (!apiResp['success']) return [];

	const downloadableUnlocks: EventUnlock[] = [];
	const unlockData = apiResp['data'];

	unlockData.forEach((unlock: any) => {
		if (unlock.downloadLink) {
			downloadableUnlocks.push({
				title: unlock.title,
				downloadLink: unlock.downloadLink,
				playStyle: unlock.playstyle === 1 ? 'SINGLE' : 'DOUBLE',
			});
		}
	});

	return downloadableUnlocks;
}

async function getUnlocksDestPath() {
	const unlocksDictionary = dictionary[language].unlocks;

	const destPath = await input({
		message: unlocksDictionary.destinationPath,
		default: process.cwd(),
		validate: async (value) => await exists(value),
	});

	// check if dest path is already an unlocks folder
	// otherwise create
	if (!basename(destPath).includes(`${eventName} Unlocks`)) {
		const unlocksUserFolderPath = join(
			destPath,
			`${eventName} Unlocks - ${itlUser.name}`
		);
		const existsUnlocksFolder = await exists(unlocksUserFolderPath);
		if (!existsUnlocksFolder) await mkdir(unlocksUserFolderPath);

		return unlocksUserFolderPath;
	}

	return destPath;
}

async function getSaveMethod() {
	const unlocksDictionary = dictionary[language].unlocks;

	const saveMethod = await select({
		message: unlocksDictionary.saveMethod.question,
		choices: [
			{
				name: unlocksDictionary.saveMethod.diff.title,
				value: 'diff',
				description: unlocksDictionary.saveMethod.diff.description,
			},
			{
				name: unlocksDictionary.saveMethod.overwrite.title,
				value: 'overwrite',
				description: unlocksDictionary.saveMethod.overwrite.description,
			},
		],
	});

	return saveMethod as SaveMethod;
}

async function getUnlockZip(unlock: EventUnlock, unlocksFolderPath: string) {
	const unlocksDictionary = dictionary[language].unlocks;

	let attempts = 0;
	let zipPath = null;
	while (attempts < maxDownloadAttempts) {
		zipPath = await downloadZip(unlock.downloadLink, unlocksFolderPath);

		if (zipPath) {
			// exit now
			attempts = maxDownloadAttempts;
		} else {
			attempts++;
			console.log(
				red(unlocksDictionary.downloadAttemptError)
					.replace('#CHAINTITLE#', unlock.title)
					.replace('#PLAYSTYLE#', unlock.playStyle)
					.replace('#ATTEMPTCOUNT#', (attempts + 1).toString())
					.replace('#MAXATTEMPTS#', maxDownloadAttempts.toString())
			);
		}
	}

	return zipPath;
}

async function downloadZip(downloadLink: string, unlocksDownloadPath: string) {
	const resp = await fetch(downloadLink);

	if (!resp.ok) return null;

	const zipName = basename(downloadLink);
	const zipPath = join(unlocksDownloadPath, zipName);

	await streamPipeline(resp.body, createWriteStream(zipPath));

	return zipPath;
}

async function getTempDownloadPath() {
	const tempDownloadPath = join(
		process.env.TEMP,
		`${eventName.replace(/\s/g, '_')}_unlocks_download`
	);
	const existsTemp = await exists(tempDownloadPath);

	if (existsTemp) await rm(tempDownloadPath, { recursive: true });

	await mkdir(tempDownloadPath);
	return tempDownloadPath;
}
