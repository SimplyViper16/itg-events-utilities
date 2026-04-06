import { createInterface } from 'readline';
import { getTranslatedLabel } from './dictionary/main.js';
import { itlUser } from './login/main.js';
import { api } from './settings.js';
import {
    ITLEntrantData,
    ITLEntrantDataChart,
    ITLEntrantDataTopScores,
    LeaderboardEntry,
} from './types.js';

export async function getLeaderboard() {
    const resp = await fetch(`${api.baseUrl}${api.routes.leaderboard}`, {
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

    return apiResp?.data?.leaderboard as LeaderboardEntry[];
}

export async function getEntrantDetails(entrantId: number) {
    const resp = await fetch(
        `${api.baseUrl}${api.routes.entrant}/${entrantId}`,
        {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Cookie: itlUser.cookie,
            },
        },
    );

    if (!resp.ok) return null;

    const jsonResp = await resp.json();
    const apiResp = jsonResp as { [key: string]: any };

    // double check
    if (!apiResp?.success) return null;

    const data = apiResp?.data;

    return {
        name: data?.entrant?.name,
        charts: data?.charts as ITLEntrantDataChart[],
        topScores: data?.topScores as ITLEntrantDataTopScores[],
    } as ITLEntrantData;
}

export async function waitKeyToClose() {
    return new Promise<void>((resolve) => {
        const rl = createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        console.log(getTranslatedLabel('goodbye'));

        rl.on('line', () => {
            rl.close();
            process.exit(0);
        });
    });
}
