import { Hole } from "./Hole";
export class Course {
    name;
    baseHoleDistances;
    holes;
    constructor(name, baseHoleDistances // 9 holes
    ) {
        this.name = name;
        this.baseHoleDistances = baseHoleDistances;
        if (baseHoleDistances.length !== 9) {
            throw new Error("A course must have exactly 9 base holes");
        }
        this.holes = Course.build18Holes(baseHoleDistances);
    }
    static build18Holes(distances) {
        const holes = [];
        distances.forEach((distance, i) => holes.push(new Hole(i + 1, distance)));
        distances.forEach((distance, i) => holes.push(new Hole(i + 10, distance)));
        return holes;
    }
}
