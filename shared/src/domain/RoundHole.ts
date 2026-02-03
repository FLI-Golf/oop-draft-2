import { HoleLayout } from "./HoleLayout";

/**
 * RoundHole represents a hole as it is played in a specific round.
 * - order: scoring position in the round (1–18)
 * - layout: which physical hole + basket position + distance is used
 */
export class RoundHole {
  /** Order in the round (1–18) */
  readonly order: number;

  /** The layout being played at this position */
  readonly layout: HoleLayout;

  constructor(order: number, layout: HoleLayout) {
    if (!Number.isInteger(order) || order < 1) {
      throw new Error(`RoundHole order must be a positive integer (got ${order})`);
    }

    if (!layout) {
      throw new Error("RoundHole requires a HoleLayout");
    }

    this.order = order;
    this.layout = layout;
  }

  /** Tee number on the course (1–9) */
  get teeNumber(): number {
    return this.layout.hole.teeNumber;
  }

  /** Basket position for this play (A/B) */
  get basketPosition() {
    return this.layout.basketPosition;
  }

  /** Distance in feet */
  get distance(): number {
    return this.layout.distance;
  }

  /** Par for this played layout */
  get par(): number {
    return this.layout.par;
  }
}
