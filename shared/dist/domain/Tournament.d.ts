import { GroupScoreResult } from './scoring/ScoreResult';
export declare enum TournamentStatus {
    SETUP = "SETUP",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    PLAYOFF_REQUIRED = "PLAYOFF_REQUIRED",
    PLAYOFF_IN_PROGRESS = "PLAYOFF_IN_PROGRESS",
    FINALIZED = "FINALIZED"
}
export declare class Tournament {
    id: string;
    name: string;
    date: Date;
    season?: string | undefined;
    status: TournamentStatus;
    playoffRound?: string;
    winner?: string;
    constructor(id: string, name: string, date: Date, season?: string | undefined);
    checkForPlayoff(results: GroupScoreResult[]): string[] | null;
    requirePlayoff(tiedTeamIds: string[]): void;
    startPlayoff(playoffGroupId: string): void;
    finalize(winnerId: string): void;
    canFinalize(): boolean;
}
