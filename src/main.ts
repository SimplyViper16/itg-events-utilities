import { select, Separator } from '@inquirer/prompts';
import pColors from 'picocolors';
import { getTranslatedLabel, setLanguage } from './common/dictionary/main.js';
import { loginUser } from './common/login/main.js';
import { waitKeyToClose } from './common/utils.js';
import { downloadITLJson } from './modules/own-scores.js';
import { saveComparisonExcel } from './modules/scores-compare.js';
import { manageUnlocks } from './modules/unlocks/main.js';

(async () => {
    // clear the console
    console.clear();

    // choose language
    await setLanguage();

    // say hello
    console.log(
        pColors.bgBlue(
            pColors.yellow(getTranslatedLabel('welcome').toUpperCase()),
        ),
    );

    // login
    let promptLogin = true;

    while (promptLogin) {
        console.log(''); // space
        const isLogged = await loginUser();

        if (isLogged) promptLogin = false;
    }

    console.log(''); // space
    const action = await select({
        message: getTranslatedLabel('actions.message'),
        choices: [
            {
                name: getTranslatedLabel('actions.list.unlocks.title'),
                value: 'download-unlocks',
                description: getTranslatedLabel(
                    'actions.list.unlocks.description',
                ),
            },
            {
                name: getTranslatedLabel('actions.list.jsonScores.title'),
                value: 'download-json-scores',
                description: getTranslatedLabel(
                    'actions.list.jsonScores.description',
                ),
            },
            {
                name: getTranslatedLabel('actions.list.excelCompare.title'),
                value: 'download-excel-compare',
                description: getTranslatedLabel(
                    'actions.list.excelCompare.description',
                ),
            },
            new Separator(),
            {
                name: getTranslatedLabel('actions.list.exit.title'),
                value: 'exit',
            },
        ],
    });

    console.log(''); // space

    if (action === 'download-unlocks') {
        await manageUnlocks();
    } else if (action === 'download-json-scores') {
        await downloadITLJson();
    } else if (action === 'download-excel-compare') {
        await saveComparisonExcel();
    }

    console.log(''); // space
    await waitKeyToClose();
})();
