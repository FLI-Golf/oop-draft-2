import type { ScoringEngine } from "./ScoringEngine";
import type { GroupScoreResult } from "./ScoreResult";
import type { Group } from "../Group";

export type CTHScoreInput = {
  teamId: string;
  distance: number; // inches, feet, or meters — your choice
}[];

export class CTHDistanceEngine
  implements ScoringEngine<CTHScoreInput>
{
  readonly model = "playoff_total_distance";

  scoreGroup(group: Group, input: CTHScoreInput): GroupScoreResult {
    if (group.teams.length < 2) {
      throw new Error("CTH scoring requires at least 2 teams");
    }

    const sorted = [...input].sort(
      (a, b) => a.distance - b.distance
    );

    return {
      groupId: group.id,
      scoringModel: this.model,
      results: sorted.map((s, index) => ({
        teamId: s.teamId,
        rank: index + 1,
        value: s.distance
      }))
    };
  }
}
