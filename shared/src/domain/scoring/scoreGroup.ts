import type { Group } from "../Group";
import type { GroupScoreResult } from "./ScoreResult";
import type { ScoringModel } from "./ScoringModel";
import { getScoringEngine } from "./ScoringRegistry";

export type ScoreGroupInput = {
  group: Group;
  model: ScoringModel;
  scores: Array<{
    teamId: string;
    totalStrokes?: number;
    distance?: number;
  }>;
};

export function scoreGroup(input: ScoreGroupInput): GroupScoreResult {
  const engine = getScoringEngine(input.model);
  return engine.scoreGroup(input.group, input.scores);
}
