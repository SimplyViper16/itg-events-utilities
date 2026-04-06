import { exec, spawn } from 'child_process';
import { red } from 'picocolors';
import { eventName } from './common/settings.js';

(async () => {
    const isBuilt = await buildApp();

    if (!isBuilt) return;

    await packageApp();
})();

async function buildApp() {
    return await new Promise((resolve, rejects) => {
        exec(`npm run build`, (err, stdout, stderr) => {
            if (err) {
                console.error(red(`Error during build: ${stderr}`));
                return resolve(false);
            }

            return resolve(true);
        });
    });
}

async function packageApp() {
    return await new Promise<void>((resolve, reject) => {
        const pkgCmd = spawn(
            'pkg',
            [
                '--output',
                `"out/${eventName} Utilities"`,
                '-t',
                'node24-win-x64',
                // 'node22-win-x64,node22-linux-x64,node22-macos-x64',
                'dist/main.js',
            ],
            { shell: true, stdio: 'inherit' },
        );

        pkgCmd.on('error', (err) => {
            console.log(red(`Package error: ${err}`));
        });

        pkgCmd.on('close', () => {
            return resolve();
        });
    });
}
