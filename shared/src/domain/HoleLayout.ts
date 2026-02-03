import { CourseHole } from "./CourseHole";

/**
 * Basket position for a physical hole.
 * A = front 9 placement
 * B = back 9 placement (same tee, different pin)
 */
export type BasketPosition = "A" | "B";

/**
 * HoleLayout represents a specific way a physical hole is played.
 * - References a CourseHole (tee)
 * - Defines basket position, distance, and par
 */
export class HoleLayout {
  /** Physical hole (tee) */
  readonly hole: CourseHole;

  /** Basket position identifier */
  readonly basketPosition: BasketPosition;

  /** Distance in feet */
  readonly distance: number;

  /** Par for this layout (default 3) */
  readonly par: number;

  constructor(params: {
    hole: CourseHole;
    basketPosition: BasketPosition;
    distance: number;
    par?: number;
  }) {
    const { hole, basketPosition, distance, par = 3 } = params;

    if (!hole) {
      throw new Error("HoleLayout requires a CourseHole");
    }

    if (distance < 200 || distance > 400) {
      throw new Error(
        `Hole ${hole.teeNumber}${basketPosition} distance must be between 200–400 feet (got ${distance})`
      );
    }

    this.hole = hole;
    this.basketPosition = basketPosition;
    this.distance = distance;
    this.par = par;
  }
}
