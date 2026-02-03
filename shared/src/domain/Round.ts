import { Player } from "./Player";
import { Score } from "./Score";
import { RoundHole } from "./RoundHole";

/**
 * Round represents a player's complete 18-hole round in a tournament.
 */
export class Round {
  static readonly TOTAL_HOLES = 18;

  private readonly scoresByHole: Map<number, Score> = new Map();

  constructor(
    public readonly id: string,
    public readonly player: Player,
    public readonly tournamentId: string,
    public readonly holes: RoundHole[]
  ) {
    if (!id || !tournamentId) {
      throw new Error("Round requires id and tournamentId");
    }

    if (holes.length !== Round.TOTAL_HOLES) {
      throw new Error(`Round must have exactly ${Round.TOTAL_HOLES} holes`);
    }
  }

  /**
   * Record a score for a hole
   */
  recordScore(holeOrder: number, strokes: number): void {
    const hole = this.holes.find((h) => h.order === holeOrder);
    if (!hole) {
      throw new Error(`Hole ${holeOrder} not found in round`);
    }

    const score = new Score(this.player, hole, strokes);
    this.scoresByHole.set(holeOrder, score);
  }

  /**
   * Get score for a specific hole
   */
  getScore(holeOrder: number): Score | undefined {
    return this.scoresByHole.get(holeOrder);
  }

  /**
   * Get all recorded scores
   */
  get scores(): Score[] {
    return Array.from(this.scoresByHole.values()).sort(
      (a, b) => a.hole.order - b.hole.order
    );
  }

  /**
   * Total strokes for completed holes
   */
  get totalStrokes(): number {
    return this.scores.reduce((sum, s) => sum + s.strokes, 0);
  }

  /**
   * Total score relative to par for completed holes
   */
  get totalToPar(): number {
    return this.scores.reduce((sum, s) => sum + s.toPar, 0);
  }

  /**
   * Number of holes completed
   */
  get holesCompleted(): number {
    return this.scoresByHole.size;
  }

  /**
   * Whether the round is complete
   */
  get isComplete(): boolean {
    return this.holesCompleted === Round.TOTAL_HOLES;
  }

  /**
   * Front 9 total (holes 1-9)
   */
  get front9Total(): number {
    return this.scores
      .filter((s) => s.hole.order <= 9)
      .reduce((sum, s) => sum + s.strokes, 0);
  }

  /**
   * Back 9 total (holes 10-18)
   */
  get back9Total(): number {
    return this.scores
      .filter((s) => s.hole.order > 9)
      .reduce((sum, s) => sum + s.strokes, 0);
  }
}
