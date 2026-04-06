import { search } from '@inquirer/prompts';
import ExcelJS from 'exceljs';
import { join } from 'path';
import pkg from 'picocolors';
import { getTranslatedLabel } from '../common/dictionary/main.js';
import { itlUser } from '../common/login/main.js';
import { ITLEntrantData } from '../common/types.js';
import {
    getEntrantDetails,
    getLeaderboard,
    waitKeyToClose,
} from '../common/utils.js';

const { green, red } = pkg;

export async function saveComparisonExcel() {
    // 1. download the leaderboard
    const opponents = await getOpponentsList();

    // 2. Search opponent
    const opponentId = await search({
        message: getTranslatedLabel('compare.opponent'),
        source: async (input) => {
            if (!input) return [];

            const opponentList = opponents.filter((v) => {
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
        opponentData?.name || 'player',
    );
    console.log(
        green(
            getTranslatedLabel('compare.done', {
                COMPAREFILENAME: excelFilename,
            }),
        ),
    );
}

async function getOpponentsList() {
    // download the leaderboard
    const leaderboard = await getLeaderboard();
    if (!leaderboard) {
        console.error(red(getTranslatedLabel('compare.leaderboardError')));
        await waitKeyToClose();
    }

    return leaderboard;
}

function compareEntrants(opponentData: ITLEntrantData | null) {
    if (!opponentData) return [];

    const compareData: {
        title: string;
        difficulty: number;
        points: number;
        itlUserPoints: number | null;
        itlUserEx: number | null;
        delta: number | null;
        opponentEx: number | null;
        opponentPoints: number | null;
    }[] = [];

    const mergedCharts = itlUser?.entrantData?.charts || [];
    for (const oChart of opponentData.charts) {
        const alreadyExists = mergedCharts?.find((c) => c.id === oChart.id);
        if (!alreadyExists) {
            mergedCharts.push(oChart);
        }
    }

    const loggedEntrantScores = itlUser?.entrantData?.topScores || [];
    const opponentEntrantScores = opponentData.topScores;

    for (const chart of mergedCharts) {
        const loggedScore = loggedEntrantScores.find(
            (s) =>
                s.chartHash === chart.hash ||
                s.chartHash === chart.hashOriginal,
        );

        const opponentScore = opponentEntrantScores.find(
            (s) =>
                s.chartHash === chart.hash ||
                s.chartHash === chart.hashOriginal,
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
            itlUserPoints: loggedScore?.points || null,
            itlUserEx: (loggedScore?.ex || 0) / 100 || null,
            delta: !loggedScore || !opponentScore ? null : deltaScore / 100,
            opponentEx: (opponentScore?.ex || 0) / 100 || null,
            opponentPoints: opponentScore?.points || null,
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
    opponentName: string,
) {
    // // temp
    // await writeFile(`scores.json`, JSON.stringify(compareData, null, 4));

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(
        `${itlUser.entrantId}-vs-${opponentId}`,
    );

    // Get headers from keys of first object
    const dataHeaders = Object.keys(compareData[0]);

    // add columns
    worksheet.columns = dataHeaders.map((h) => ({
        header: (() => {
            let header = h;

            if (h === 'itlUserPoints') header = `${itlUser.name} points`;
            if (h === 'itlUserEx') header = `${itlUser.name} ex`;
            if (h === 'opponentEx') header = `${opponentName} ex`;
            if (h === 'opponentPoints') header = `${opponentName} points`;

            return header.toUpperCase();
        })(),
        key: h,
        width: h === 'title' ? 50 : 20,
        style: {
            alignment: {
                vertical: 'middle',
                ...getColHorizontalAlignment(h),
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
            if (colNum === 6 && cell.value !== null) {
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

            if (colNum === 5 || colNum === 6 || colNum === 7) {
                cell.numFmt = '0.00';
            }
        });
    }

    const excelFilename = `${itlUser.name} vs ${opponentName} compare scores.xlsx`;

    // Save to file
    await workbook.xlsx.writeFile(join(process.cwd(), excelFilename));

    return excelFilename;
}

function getColHorizontalAlignment(colKey: string) {
    if (
        ['difficulty', 'points', 'itlUserPoints', 'opponentPoints'].indexOf(
            colKey,
        ) > -1
    ) {
        return { horizontal: 'center' };
    }

    if (colKey === 'opponentEx') return { horizontal: 'left' };

    return {};
}
