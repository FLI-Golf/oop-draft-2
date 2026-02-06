import type { ScoringEngine } from "./ScoringEngine";
import type { GroupScoreResult } from "./ScoreResult";
import type { Group } from "../Group";

export type SuddenDeathInput = {
  teamId: string;
  holeScores: number[]; // score per hole played in sudden death
}[];

export class SuddenDeathEngine implements ScoringEngine<SuddenDeathInput> {
  readonly model = "playoff_sudden_death_hole";

  scoreGroup(group: Group, input: SuddenDeathInput): GroupScoreResult {
    if (group.teams.length < 2) {
      throw new Error("Sudden death requires at least 2 teams");
    }

    // Sum all hole scores for each team
    const withTotals = input.map((t) => ({
      teamId: t.teamId,
      total: t.holeScores.reduce((sum, s) => sum + s, 0)
    }));

    const sorted = [...withTotals].sort((a, b) => a.total - b.total);

    return {
      groupId: group.id,
      scoringModel: this.model,
      results: sorted.map((s, index) => ({
        teamId: s.teamId,
        rank: index + 1,
        value: s.total
      }))
    };
  }
}
