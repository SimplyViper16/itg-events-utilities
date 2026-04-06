export interface LeaderboardEntry {
    id: number;
    name: string;
    rankingPoints: number;
}

export interface ITLEntrantDataChart {
    id: number;
    title: string;
    hash: string | null;
    hashOriginal: string | null;
    playstyle: number;
    meter: number;
    points: number; // maxPoints
    pointsPassing: number; // passingPoints
    pointsScoring: number; // maxScoringPoints
    totalSteps: number; // judgments -> totalSteps
    totalRolls: number; // judgments -> totalRolls
    totalHolds: number; // judgments -> totalRolls
    totalMines: number; // judgments -> totalRolls
    isNoCmod: boolean; // noCmod
    unlockId: number; // -1 noUnlock
}

export interface ITLEntrantDataTopScores {
    lastImproved: string; // date (yyyy-MM-dd)
    clearType: number; // clearType
    chartHash: string;
    fantasticPlus: number; // judgments -> W0
    fantastic: number; // judgments -> W1
    excellent: number; // judgments -> W2
    great: number; // judgments -> W3
    decent: number; // judgments -> W4
    wayOff: number; // judgments -> W5
    miss: number; // judgments -> Miss
    minesHit: number; // judgments -> Mines
    holdsHeld: number; // judgments -> Holds
    rollsHeld: number; // judgments -> Rolls
    ex: number; // ex
    points: number; // points
}

export class ITLEntrantData {
    name!: string;
    charts: ITLEntrantDataChart[] = [];
    topScores: ITLEntrantDataTopScores[] = [];
}
