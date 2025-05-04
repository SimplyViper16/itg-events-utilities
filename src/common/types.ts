export type SaveMethod = 'diff' | 'overwrite';

export interface EventUnlock {
	title: string;
	downloadLink: string;
	// 1 -> Single / 2 -> Double
	playStyle: 'SINGLE' | 'DOUBLE';
}

export interface ITLUser {
	name: string;
	cookie: string;
	entrantId: number;
	entrantData: ITLEntrantData;
}

export interface ITLEntrantData {
	name: string;
	charts: {
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
	}[];
	topScores: {
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
	}[];
}

export interface ITLScore {
	clearType: number;
	date: string;
	ex: number;
	judgments: {
		Holds: number;
		Mines: number;
		Miss: number;
		Rolls: number;
		W0: number;
		W1: number;
		W2: number;
		W3: number;
		W4: number;
		W5: number;
		totalHolds: number;
		totalMines: number;
		totalRolls: number;
		totalSteps: number;
	};
	maxPoints: number;
	maxScoringPoints: number;
	noCmod: boolean;
	passingPoints: number;
	points: number;
	usedCmod: boolean;

	// custom
	playStyle?: number;
}

export interface LeaderboardEntry {
	id: number;
	name: string;
	rankingPoints: number;
}
