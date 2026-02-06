export type GroupStage = "standard" | "playoff";

/**
 * ScoringModel describes *how* to rank teams within a group.
 * Keep this small + explicit; add new models as formats evolve.
 */
export type ScoringModel =
  | "standard_match_total_strokes"     // 2 teams, least total strokes wins
  | "playoff_total_strokes"            // 2-4 teams, least total strokes wins
  | "playoff_sudden_death_hole";       // 2-4 teams, first winner hole-by-hole
