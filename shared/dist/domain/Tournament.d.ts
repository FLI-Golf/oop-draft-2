export type Season = "2026" | "2027" | "2028" | "2029";

export declare class Tournament {
    name: string;
    date: Date;
    season: Season;

    constructor(name: string, date: Date, season: Season);
}
