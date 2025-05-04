import { bgBlue, yellow } from 'picocolors';
import { chooseLanguage, dictionary, language } from './modules/dictionary';
import { loginUser } from './common/login';
import { manageUnlocks } from './modules/unlocks';
import { select, Separator } from '@inquirer/prompts';
import { saveITLScoresJson } from './modules/scores';
import { waitKeyToClose } from './common/common';
import { saveComparisonExcel } from './modules/compare';

(async () => {
	// clear the console
	console.clear();

	await chooseLanguage();

	console.log(bgBlue(yellow(dictionary[language].welcome.toUpperCase())));

	// login
	let promptLogin = true;

	while (promptLogin) {
		console.log(''); // space
		const isLogged = await loginUser();

		if (isLogged) promptLogin = false;
	}

	console.log(''); // space
	const action = await select({
		message: dictionary[language].actions.message,
		choices: [
			{
				name: dictionary[language].actions.list.unlocks.title,
				value: 'download-unlocks',
				description:
					dictionary[language].actions.list.unlocks.description,
			},
			{
				name: dictionary[language].actions.list.jsonScores.title,
				value: 'download-json-scores',
				description:
					dictionary[language].actions.list.jsonScores.description,
			},
			{
				name: dictionary[language].actions.list.excelCompare.title,
				value: 'download-excel-compare',
				description:
					dictionary[language].actions.list.excelCompare.description,
			},
			new Separator(),
			{
				name: dictionary[language].actions.list.exit.title,
				value: 'exit',
			},
		],
	});

	console.log(''); // space

	if (action === 'download-unlocks') {
		await manageUnlocks();
	}
	if (action === 'download-json-scores') {
		await saveITLScoresJson();
	}
	if (action === 'download-excel-compare') {
		await saveComparisonExcel();
	}

	console.log(''); // space
	await waitKeyToClose();
})();
