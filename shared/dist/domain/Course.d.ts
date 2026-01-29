import { Hole } from "./Hole";
export declare class Course {
    name: string;
    baseHoleDistances: number[];
    readonly holes: Hole[];
    constructor(name: string, baseHoleDistances: number[]);
    static build18Holes(distances: number[]): Hole[];
}
