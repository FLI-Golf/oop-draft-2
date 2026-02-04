import type { ScoreGroupInput, GroupResult } from "./types";

export const scoringStrategies: Record<
  ScoreGroupInput["model"],
  (input: ScoreGroupInput) => GroupResult
> = {
  standard_match_total_strokes: (input) => {
    if (input.group.teams.length !== 2) {
      throw new Error("Standard stroke play requires exactly 2 teams");
    }

    const sorted = [...input.teamScores].sort(
      (a, b) => (a.totalStrokes ?? Infinity) - (b.totalStrokes ?? Infinity)
    );

    return {
      tournamentId: input.tournamentId,
      groupId: input.group.id,
      model: input.model,
      placements: sorted.map((t, index) => ({
        teamId: t.teamId,
        place: index + 1,
        totalStrokes: t.totalStrokes
      })),
      winnerTeamId: sorted[0]?.teamId
    };
  },

  playoff_total_distance: (input) => {
    if (input.group.teams.length < 2) {
      throw new Error("CTH playoff requires at least 2 teams");
    }

    const sorted = [...input.teamScores].sort(
      (a, b) =>
        (a.distanceToBasket ?? Infinity) -
        (b.distanceToBasket ?? Infinity)
    );

    return {
      tournamentId: input.tournamentId,
      groupId: input.group.id,
      model: input.model,
      placements: sorted.map((t, index) => ({
        teamId: t.teamId,
        place: index + 1,
        notes: `Distance: ${t.distanceToBasket}`
      })),
      winnerTeamId: sorted[0]?.teamId
    };
  },

  playoff_sudden_death_hole: (input) => {
    const sorted = [...input.teamScores].sort(
      (a, b) =>
        (a.holeStrokes?.reduce((s, n) => s + n, 0) ?? Infinity) -
        (b.holeStrokes?.reduce((s, n) => s + n, 0) ?? Infinity)
    );

    return {
      tournamentId: input.tournamentId,
      groupId: input.group.id,
      model: input.model,
      placements: sorted.map((t, index) => ({
        teamId: t.teamId,
        place: index + 1
      })),
      winnerTeamId: sorted[0]?.teamId
    };
  }
};
