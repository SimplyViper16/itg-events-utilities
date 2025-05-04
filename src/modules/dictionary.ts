import { select } from '@inquirer/prompts';
import { eventName, eventNameShort } from '../common/settings';

export const dictionary = {
	en: {
		language: 'English',
		welcome: `Welcome to ${eventName} unlocks downloader!`,
		goodbye: `We are done! 🥳 Press enter to exit...`,
		login: {
			entryMessage: `First you have to login just like you do in the ${eventName} site!`,
			username: 'Enter your username:',
			password: 'Enter your password:',
			error: 'Sorry, something goes wrong during login. Please, check your username and/or password',
			success: 'Welcome #ITLPLAYERNAME#!',
		},
		actions: {
			message: `What do you want to do?`,
			list: {
				unlocks: {
					title: 'Download Unlocks',
					description: 'Download all your unlocks at once!',
				},
				jsonScores: {
					title: `Download ${eventNameShort}.json file`,
					description:
						'Download your event data json file (to put on your profile folder)',
				},
				excelCompare: {
					title: `Download player compare as excel file for ${eventName}`,
					description:
						'Choose your opponent and download your score compare!',
				},
				exit: { title: 'Exit' },
			},
		},
		unlocks: {
			checking: 'Checking your unlocks...',
			downloadableCount: 'Found #NUMDOWNLOAD# downloadable unlocks!',
			noneDownloadable:
				'None downloadable unlock found! Keep playing! 😁',
			saveMethod: {
				question: 'How do you prefer the save to be handled?',
				overwrite: {
					title: 'Download all and overwrite',
					description:
						'If the same unlocks are found in the target folder, they will be overwritten.',
				},
				diff: {
					title: 'Save only the missing ones',
					description:
						'Only unlocks that are not already in the destination folder will be saved.',
				},
			},
			destinationPath: 'Give me the path where save unlocks:',
			downloadSuccess:
				'✔️    Unlock #CHAINTITLE# (#PLAYSTYLE#) successfully downloaded!',
			downloadAttemptError: `😔 Something goes wrong with the download of the unlock #CHAINTITLE# (#PLAYSTYLE#). Attempt #ATTEMPTCOUNT#/#MAXATTEMPTS#. Trying again...`,
			downloadDefError: `😭 I ran out of attempts to download the #CHAINTITLE# (#PLAYSTYLE#) unlock. Please, try again later.`,
			downloadDone: `🎉 #UNLOCKSDOWNLOADED#/#TOTALUNLOCKS# unlocks downloaded successfully!`,
			overwriteDone: `✅ All unlocks have been downloaded and saved/overwritten to the destination folder!`,
			diffDone: `🆕	#FOLDERNAME# unlock added!`,
		},
		scores: {
			done: `File #SCOREFILENAME# saved successfully!`,
		},
		compare: {
			leaderboardError:
				'Something wrong when downloading the leaderboard',
			opponent:
				'Choose your opponent (type first letters of player name):',
			done: `File #COMPAREFILENAME# saved successfully!`,
		},
	},
	it: {
		language: 'Italiano',
		welcome: `Benvenuto in ${eventName} unlocks downloader!`,
		goodbye: `Qui abbiamo finito! 🥳 Premi invio per uscire...`,
		login: {
			entryMessage: `Prima cosa, devi loggarti come faresti sul sito di ${eventName}!`,
			username: 'Il tuo username:',
			password: 'La tua password:',
			error: 'Mi spiace, qualcosa è andato storto durante il login. Controlla username e/o password.',
			success: 'Benvenuto/a #ITLPLAYERNAME#!',
		},
		actions: {
			message: `Cosa vuoi fare?`,
			list: {
				unlocks: {
					title: 'Download Unlocks',
					description:
						'Scarica tutti i tuoi unlocks in una volta sola!',
				},
				jsonScores: {
					title: `Download file ${eventNameShort}.json`,
					description:
						'Scarica i tuoi score come json file (da mettere nel tuo profilo)',
				},
				excelCompare: {
					title: `Scarica l'excel di comparazione per ${eventName}`,
					description:
						'Scegli il tuo avversario e scarica il compare dei vostri score!',
				},
				exit: { title: 'Esci' },
			},
		},
		unlocks: {
			checking: 'Controllo i tuoi unlocks...',
			downloadableCount: 'Ho trovato #NUMDOWNLOAD# unlocks scaricabili!',
			noneDownloadable:
				'Non ho trovato alcun unlock scaricabile. Continua a giocare! 😁',
			saveMethod: {
				question: 'Come preferisci che venga gestito il salvataggio?',
				overwrite: {
					title: 'Scarica tutti e sovrascrivi',
					description:
						'Se vengono trovati gli unlocks uguali nella cartella di destinazione, essi verranno sovrascritti.',
				},
				diff: {
					title: 'Salva solo i mancanti',
					description:
						'Vengono salvati solo gli unlocks che non si trovano già nella cartella di destinazione.',
				},
			},
			destinationPath: 'Dimmi il percorso dove scaricare gli unlocks:',
			downloadSuccess:
				'✔️    Unlock #CHAINTITLE# (#PLAYSTYLE#) scaricato con successo!',
			downloadAttemptError: `😔 Qualcosa è andato storto con il download dell'Unlock #CHAINTITLE# (#PLAYSTYLE#). Tentativo #ATTEMPTCOUNT#/#MAXATTEMPTS#. Riprovo...`,
			downloadDefError: `😭 Ho esaurito i tentativi per scaricare l'unlock #CHAINTITLE# (#PLAYSTYLE#). Riprova più tardi.`,
			downloadDone: `🎉 Sono stati scaricati con successo #UNLOCKSDOWNLOADED#/#TOTALUNLOCKS# unlocks`,
			overwriteDone: `✅ Tutti gli unlocks sono stati scaricati e salvati/sovrascritti nella cartella di destinazione!`,
			diffDone: `🆕	#FOLDERNAME# unlock aggiunto!`,
		},
		scores: {
			done: `Salvato il file #SCOREFILENAME# correttamente!`,
		},
		compare: {
			leaderboardError:
				'Qualcosa è andato storto durante il download della leaderboard',
			opponent:
				'Scegli il tuo avversario (scrivi le prime lettere del nome):',
			done: `File #COMPAREFILENAME# salvato correttamente!`,
		},
	},
};

export let language = 'en';

export async function chooseLanguage() {
	const langCodes = Object.keys(dictionary);
	const languageList: { name: string; value: string }[] = [];

	langCodes.forEach((code) => {
		languageList.push({
			name: dictionary[code].language,
			value: code,
		});
	});

	language = await select({
		message: 'Select language:',
		choices: languageList,
	});
}
