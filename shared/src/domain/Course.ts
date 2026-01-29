import { Hole } from "./Hole";

export class Course {
  public readonly holes: Hole[];

  constructor(
    public name: string,
    public baseHoleDistances: number[] // 9 holes
  ) {
    if (baseHoleDistances.length !== 9) {
      throw new Error("A course must have exactly 9 base holes");
    }

    this.holes = Course.build18Holes(baseHoleDistances);
  }

  static build18Holes(distances: number[]): Hole[] {
    const holes: Hole[] = [];

    distances.forEach((distance, i) => holes.push(new Hole(i + 1, distance)));
    distances.forEach((distance, i) => holes.push(new Hole(i + 10, distance)));

    return holes;
  }
}
