import { green, red } from 'picocolors';
import {
	getEntrantDetails,
	getLeaderboard,
	waitKeyToClose,
} from '../common/common';
import { dictionary, language } from './dictionary';
import { search } from '@inquirer/prompts';
import { ITLEntrantData } from '../common/types';
import { itlUser } from '../common/login';
import { Workbook } from 'exceljs';
import { join } from 'path';

export async function saveComparisonExcel() {
	// 1. download the leaderboard
	const leaderboard = await getOpponentsList();

	// 2. Search opponent
	const opponentId = await search({
		message: dictionary[language].compare.opponent,
		source: async (input) => {
			if (!input) return [];

			const opponentList = leaderboard.filter((v) => {
				if (v.name.toLowerCase().includes(input.toLowerCase()))
					return true;
				return false;
			});

			return opponentList.map((v) => ({
				name: `${v.name} (RP: ${v.rankingPoints})`,
				value: v.id,
			}));
		},
	});

	// 3. Download opponent entrant data
	const opponentData = await getEntrantDetails(opponentId);

	// 4. Make the comparison
	const compareData = compareEntrants(opponentData);

	// 5. Create excel file
	const excelFilename = await writeExcel(
		compareData,
		opponentId,
		opponentData.name
	);
	console.log(
		green(
			dictionary[language].compare.done.replace(
				'#COMPAREFILENAME#',
				excelFilename
			)
		)
	);
}

async function getOpponentsList() {
	// download the leaderboard
	const leaderboard = await getLeaderboard();
	if (!leaderboard) {
		console.error(red(dictionary[language].compare.leaderboardError));
		await waitKeyToClose();
	}

	return leaderboard;
}

function compareEntrants(opponentData: ITLEntrantData) {
	const compareData: {
		title: string;
		difficulty: number;
		points: number;
		[itlUser.name]: number;
		delta: number;
		[opponentData.name]: number;
	}[] = [];

	const mergedCharts = itlUser.entrantData.charts;
	for (const oChart of opponentData.charts) {
		const alreadyExists = mergedCharts.find((c) => c.id === oChart.id);
		if (!alreadyExists) {
			mergedCharts.push(oChart);
		}
	}

	const loggedEntrantScores = itlUser.entrantData.topScores;
	const opponentEntrantScores = opponentData.topScores;

	for (const chart of mergedCharts) {
		const loggedScore = loggedEntrantScores.find(
			(s) =>
				s.chartHash === chart.hash || s.chartHash === chart.hashOriginal
		);

		const opponentScore = opponentEntrantScores.find(
			(s) =>
				s.chartHash === chart.hash || s.chartHash === chart.hashOriginal
		);

		const deltaScore = (loggedScore?.ex || 0) - (opponentScore?.ex || 0);

		compareData.push({
			title: `[${chart.points}][${chart.meter < 10 ? '0' : ''}${
				chart.meter
			}] ${chart.title}${chart.isNoCmod ? ' 🚫' : ''}${
				chart.unlockId !== -1 ? ' 🔓' : ''
			}`,
			difficulty: chart.meter,
			points: chart.points,
			[itlUser.name]: loggedScore?.ex / 100 || null,
			delta: !loggedScore || !opponentScore ? null : deltaScore / 100,
			[opponentData.name]: opponentScore?.ex / 100 || null,
		});
	}

	compareData.sort((a, b) => {
		const aDelta = a.delta;
		const bDelta = b.delta;

		const aIsNull = aDelta === null;
		const bIsNull = bDelta === null;

		if (aIsNull && !bIsNull) return 1;
		if (!aIsNull && bIsNull) return -1;
		if (!aIsNull && !bIsNull) {
			if (aDelta !== bDelta) return aDelta - bDelta;
			return a.points - b.points; // secondary sort
		}

		// both null — preserve original order or sort by points as fallback
		return a.points - b.points;
	});

	return compareData;
}

async function writeExcel(
	compareData: any[],
	opponentId: number,
	opponentName: string
) {
	// // temp
	// await writeFile(`scores.json`, JSON.stringify(compareData, null, 4));

	// Create workbook and worksheet
	const workbook = new Workbook();
	const worksheet = workbook.addWorksheet(
		`${itlUser.entrantId}-vs-${opponentId}`
	);

	// Get headers from keys of first object
	const dataHeaders = Object.keys(compareData[0]);

	// add columns
	worksheet.columns = dataHeaders.map((h) => ({
		header: h.toUpperCase(),
		key: h,
		width: h === 'title' ? 50 : 15,
		style: {
			alignment: {
				vertical: 'middle',
				...(['difficulty', 'points'].indexOf(h) > -1
					? { horizontal: 'center' }
					: {}),
			},
		},
	}));

	// apply style to columns
	const headerRow = worksheet.getRow(1);
	headerRow.eachCell((cell, colNum) => {
		cell.fill = {
			type: 'pattern',
			pattern: 'solid',
			fgColor: {
				argb: '03A5FC',
			},
		};
		cell.alignment = {
			horizontal: 'center',
			vertical: 'middle',
		};
		cell.font = { bold: true, size: 14 };
	});

	// header frozen
	worksheet.views = [
		{
			state: 'frozen',
			xSplit: 0,
			ySplit: 1,
		},
	];

	const wsRows = worksheet.addRows(compareData);
	for (const row of wsRows) {
		row.eachCell({ includeEmpty: true }, (cell, colNum) => {
			if (colNum === 5 && cell.value !== null) {
				cell.fill = {
					type: 'pattern',
					pattern: 'solid',
					fgColor: {
						argb:
							(cell.value as number) > 0
								? '00AB28'
								: (cell.value as number) === 0
								? 'CCC0DA'
								: 'AB1400',
					},
				};
				cell.font = {
					color: {
						argb: (cell.value as number) >= 0 ? '000000' : 'FFFFFF',
					},
				};
			}

			if (colNum === 4 || colNum === 5 || colNum === 6) {
				cell.numFmt = '0.00';
			}
		});
	}

	const excelFilename = `${itlUser.name} vs ${opponentName} compare scores.xlsx`;

	// Save to file
	await workbook.xlsx.writeFile(join(process.cwd(), excelFilename));

	return excelFilename;
}
