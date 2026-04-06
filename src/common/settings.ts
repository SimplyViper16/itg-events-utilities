export const eventYear = 2026;
export const eventName = `ITL Online ${eventYear}`;

export const api = {
    baseUrl: 'https://itl2026.groovestats.com',
    routes: {
        login: '/api/session/login',
        session: '/api/session',
        entrant: '/api/entrant',
        unlocks: '/api/unlock/list?displayRomaji=false',
        leaderboard: '/api/entrant/leaderboard',
    },
};

export const maxDownloadAttempts = 5;
