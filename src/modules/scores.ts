import { green } from 'picocolors';
import { writeFile } from 'fs-extra';
import { itlUser } from '../common/login';
import { ITLScore } from '../common/types';
import { eventNameShort } from '../common/settings';
import { dictionary, language } from './dictionary';

export async function saveITLScoresJson() {
	const chartsList = itlUser.entrantData.charts;

	// parse score
	const playerScores = itlUser.entrantData.topScores;
	const hashMap: { [hash: string]: ITLScore } = {};

	for (const score of playerScores) {
		const hash = score.chartHash;

		const chartDetails = chartsList.find(
			(c) => hash === c.hashOriginal || hash === c.hash
		);

		if (chartDetails) {
			const scoreDate = new Date(score.lastImproved);

			hashMap[hash] = {
				clearType: score.clearType,
				date: scoreDate.toJSON().split('T')[0],
				ex: score.ex,
				judgments: {
					Holds: score.holdsHeld,
					Mines: score.minesHit,
					Miss: score.miss,
					Rolls: score.rollsHeld,
					W0: score.fantasticPlus,
					W1: score.fantastic,
					W2: score.excellent,
					W3: score.great,
					W4: score.decent,
					W5: score.wayOff,
					totalHolds: chartDetails.totalHolds,
					totalMines: chartDetails.totalMines,
					totalRolls: chartDetails.totalRolls,
					totalSteps: chartDetails.totalSteps,
				},
				maxPoints: chartDetails.points,
				maxScoringPoints: chartDetails.pointsScoring,
				noCmod: chartDetails.isNoCmod,
				passingPoints: chartDetails.pointsPassing,
				points: score.points,
				usedCmod: !chartDetails.isNoCmod, // invert
				playStyle: chartDetails.playstyle,
			};
		}
	}

	const hashMapOrdered = Object.keys(hashMap)
		.sort()
		.reduce((obj, key) => {
			obj[key] = hashMap[key];
			return obj;
		}, {});

	const scoreFilename = `${itlUser.entrantId}-${itlUser.name}-${eventNameShort}.json`;

	await writeFile(
		scoreFilename,
		JSON.stringify({ hashMap: hashMapOrdered, pathMap: {} })
	);

	console.log(
		green(
			dictionary[language].scores.done.replace(
				'#SCOREFILENAME#',
				scoreFilename
			)
		)
	);
}
