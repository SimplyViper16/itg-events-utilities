export type UnlocksSaveMethod = 'diff' | 'overwrite';

export interface EventUnlock {
    title: string;
    downloadLink: string;
    // 1 -> Single / 2 -> Double
    playStyle: 'SINGLE' | 'DOUBLE';
}
