import type { Group } from "../Group";
import type { GroupScoreResult } from "./ScoreResult";

export interface ScoringEngine<Input> {
  readonly model: string;
  scoreGroup(group: Group, input: Input): GroupScoreResult;
}
