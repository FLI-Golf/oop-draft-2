import { scoreGroup } from "$shared/domain/scoring/scoreGroup";

const result = scoreGroup({
  tournamentId,
  group,
  model: group.stage === "standard" ? "standard_match_total_strokes" : "playoff_total_strokes",
  teamScores,
});
