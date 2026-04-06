import { input, password } from '@inquirer/prompts';
import pColors from 'picocolors';
import { getTranslatedLabel } from '../dictionary/main.js';
import { api } from '../settings.js';
import { getEntrantDetails } from '../utils.js';
import { ITLUser } from './types.js';

export const itlUser: ITLUser = {
    name: '',
    cookie: '',
    entrantId: 0,
    entrantData: null,
};

export async function loginUser() {
    // Show message
    console.log(`${getTranslatedLabel('login.entryMessage')}`);

    const username = await input({
        message: getTranslatedLabel('login.username'),
        required: true,
    });
    const pass = await password({
        message: getTranslatedLabel('login.password'),
        mask: true,
        validate: (value) => {
            if (!value) return false;
            return true;
        },
    });

    const isLogged = await loginToSite(username, pass);
    if (!isLogged) {
        console.error(pColors.red(getTranslatedLabel('login.error')));
        return false;
    }

    const haveId = await getEntrantId();
    if (!haveId) {
        console.error(pColors.red(getTranslatedLabel('login.error')));
        return false;
    }

    const entrantData = await getEntrantDetails(itlUser.entrantId);
    if (!entrantData) {
        console.error(pColors.red(getTranslatedLabel('login.error')));
        return false;
    }
    // save name
    itlUser.name = entrantData.name;
    itlUser.entrantData = entrantData;

    console.log(''); // space
    console.log(
        pColors.green(
            getTranslatedLabel('login.success', {
                ITLPLAYERNAME: itlUser.name,
            }),
        ),
    );

    return true;
}

async function loginToSite(username: string, password: string) {
    const resp = await fetch(`${api.baseUrl}${api.routes.login}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
    });

    if (!resp.ok) return false;

    const jsonResp = await resp.json();
    const apiResp = jsonResp as { [key: string]: any };

    // double check
    if (!apiResp.success) return false;

    // Accessing response headers
    const setCookieHeader = resp.headers.getSetCookie();
    if (!setCookieHeader.length) return false;

    itlUser.cookie = setCookieHeader[0].split(';')[0];

    return true;
}

async function getEntrantId() {
    const resp = await fetch(`${api.baseUrl}${api.routes.session}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Cookie: itlUser.cookie,
        },
    });

    if (!resp.ok) return false;

    const jsonResp = await resp.json();
    const apiResp = jsonResp as { [key: string]: any };

    // double check
    if (!apiResp.success) return false;

    itlUser.entrantId = apiResp?.data?.entrantId;

    return true;
}
