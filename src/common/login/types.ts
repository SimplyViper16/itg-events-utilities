import { ITLEntrantData } from '../types.js';

export class ITLUser {
    name!: string;
    cookie!: string;
    entrantId!: number;
    entrantData!: ITLEntrantData | null;
}
