import { input, password } from '@inquirer/prompts';
import { green, red } from 'picocolors';
import { apiRoutes, siteUrl } from './settings';
import { ITLUser } from './types';
import { dictionary, language } from '../modules/dictionary';
import { getEntrantDetails } from './common';

export const itlUser: ITLUser = {
	name: null,
	cookie: null,
	entrantId: null,
	entrantData: null,
};

export async function loginUser() {
	const loginDictionary = dictionary[language].login;

	console.log(`${loginDictionary.entryMessage}`);

	const username = await input({
		message: loginDictionary['username'],
		required: true,
	});
	const pass = await password({
		message: loginDictionary['password'],
		mask: true,
		validate: (value) => {
			if (!value) return false;
			return true;
		},
	});

	const isLogged = await loginToSite(username, pass);
	if (!isLogged) {
		console.error(red(loginDictionary.error));
		return false;
	}

	const haveId = await getEntrantId();
	if (!haveId) {
		console.error(red(loginDictionary.error));
		return false;
	}

	const entrantData = await getEntrantDetails(itlUser.entrantId);
	if (!entrantData) {
		console.error(red(loginDictionary.error));
		return false;
	}
	// save name
	itlUser.name = entrantData.name;
	itlUser.entrantData = entrantData;

	console.log(''); // space
	console.log(
		green(loginDictionary.success.replace('#ITLPLAYERNAME#', itlUser.name))
	);

	return true;
}

async function loginToSite(username: string, password: string) {
	const resp = await fetch(`${siteUrl}${apiRoutes.login}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ username, password }),
		credentials: 'include',
	});

	if (!resp.ok) return false;

	const apiResp = await resp.json();
	// double check
	if (!apiResp['success']) return false;

	// Accessing response headers
	const setCookieHeader = resp.headers.getSetCookie();
	if (!setCookieHeader.length) return false;

	itlUser.cookie = setCookieHeader[0].split(';')[0];

	return true;
}

async function getEntrantId() {
	const resp = await fetch(`${siteUrl}${apiRoutes.session}`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			Cookie: itlUser.cookie,
		},
	});

	if (!resp.ok) return false;

	const apiResp = await resp.json();
	// double check
	if (!apiResp['success']) return false;

	itlUser.entrantId = apiResp['data'].entrantId;

	return true;
}
