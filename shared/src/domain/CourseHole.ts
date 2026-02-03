/**
 * CourseHole represents a physical hole on a course.
 * - Exists once per course
 * - Tee location never changes
 * - Basket positions and distances are defined elsewhere
 */
export class CourseHole {
  /** Tee number on the course (1–9) */
  readonly teeNumber: number;

  constructor(teeNumber: number) {
    if (!Number.isInteger(teeNumber) || teeNumber < 1) {
      throw new Error(
        `CourseHole teeNumber must be a positive integer (got ${teeNumber})`
      );
    }
    this.teeNumber = teeNumber;
  }
}
