import type { Team } from "../Team";
import type { Group } from "../Group";
import type { ScoringModel } from "../ScoringModel";

/**
 * Minimal scoring input: totals by team, plus optional per-hole for playoff models.
 * You can expand this later (penalties, OB, etc.) without changing strategy selection.
 */
export type TeamScore = {
  teamId: Team["id"];

  // Standard stroke play
  totalStrokes?: number;

  // Closest To Hole / Basket (lower = better)
  distanceToBasket?: number;

  // Optional: for sudden death or hole-by-hole reasoning
  holeStrokes?: number[];
};


export type ScoreGroupInput = {
  tournamentId: string;
  group: Group;
  model: ScoringModel;
  teamScores: TeamScore[];
};

export type GroupResult = {
  tournamentId: string;
  groupId: Group["id"];
  model: ScoringModel;

  // ordered best->worst
  placements: Array<{
    teamId: Team["id"];
    place: number; // 1..N
    totalStrokes?: number;
    notes?: string;
  }>;

  // for bracket/playoff usage
  winnerTeamId?: Team["id"];

  // if you need tie handling later
  ties?: Array<{ teamIds: Team["id"][]; place: number; reason: string }>;
};
