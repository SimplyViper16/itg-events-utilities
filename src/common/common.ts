import { createInterface } from 'readline';
import { itlUser } from './login';
import { apiRoutes, siteUrl } from './settings';
import { ITLEntrantData, LeaderboardEntry } from './types';
import { dictionary, language } from '../modules/dictionary';

export async function getLeaderboard() {
	const resp = await fetch(`${siteUrl}${apiRoutes.leaderboard}`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			Cookie: itlUser.cookie,
		},
	});

	if (!resp.ok) return null;

	const apiResp = await resp.json();
	// double check
	if (!apiResp['success']) return null;

	return apiResp['data'].leaderboard as LeaderboardEntry[];
}

export async function getEntrantDetails(entrantId: number) {
	const resp = await fetch(`${siteUrl}${apiRoutes.entrant}/${entrantId}`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			Cookie: itlUser.cookie,
		},
	});

	if (!resp.ok) return null;

	const apiResp = await resp.json();
	// double check
	if (!apiResp['success']) return null;

	const data = apiResp['data'];

	return {
		name: data.entrant.name,
		charts: data.charts,
		topScores: data.topScores,
	} as ITLEntrantData;
}

export async function waitKeyToClose() {
	return new Promise<void>((resolve) => {
		const rl = createInterface({
			input: process.stdin,
			output: process.stdout,
		});

		console.log(dictionary[language].goodbye);

		rl.on('line', () => {
			rl.close();
			process.exit(0);
		});
	});
}
