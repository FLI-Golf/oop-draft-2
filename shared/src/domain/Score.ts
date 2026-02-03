import { Player } from "./Player";
import { RoundHole } from "./RoundHole";

/**
 * Score represents a player's score on a single hole.
 */
export class Score {
  constructor(
    public readonly player: Player,
    public readonly hole: RoundHole,
    public readonly strokes: number
  ) {
    if (strokes < 1 || strokes > 10) {
      throw new Error(`Strokes must be between 1 and 10 (got ${strokes})`);
    }
  }

  /**
   * Score relative to par (negative = under par)
   */
  get toPar(): number {
    return this.strokes - this.hole.par;
  }

  /**
   * Display name for score relative to par
   */
  get toParName(): string {
    const diff = this.toPar;
    if (diff === -2) return "Eagle";
    if (diff === -1) return "Birdie";
    if (diff === 0) return "Par";
    if (diff === 1) return "Bogey";
    if (diff === 2) return "Double Bogey";
    return `+${diff}`;
  }
}
