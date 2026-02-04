import type { ScoringEngine } from "./ScoringEngine";
import type { GroupScoreResult } from "./ScoreResult";
import type { Group } from "../Group";

export type StrokeScoreInput = {
  teamId: string;
  totalStrokes: number;
}[];

export class StandardStrokeEngine
  implements ScoringEngine<StrokeScoreInput>
{
  readonly model = "standard_match_total_strokes";

  scoreGroup(group: Group, input: StrokeScoreInput): GroupScoreResult {
    if (group.teams.length !== 2) {
      throw new Error("Standard stroke scoring requires exactly 2 teams");
    }

    const sorted = [...input].sort(
      (a, b) => a.totalStrokes - b.totalStrokes
    );

    return {
      groupId: group.id,
      scoringModel: this.model,
      results: sorted.map((s, index) => ({
        teamId: s.teamId,
        rank: index + 1,
        value: s.totalStrokes
      }))
    };
  }
}
