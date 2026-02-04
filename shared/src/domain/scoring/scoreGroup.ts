import type { ScoreGroupInput, GroupResult } from "./types";
import { scoringStrategies } from "./strategies";

export function scoreGroup(input: ScoreGroupInput): GroupResult {
  const fn = scoringStrategies[input.model];
  if (!fn) throw new Error(`No scoring strategy registered for model: ${input.model}`);
  return fn(input);
}
