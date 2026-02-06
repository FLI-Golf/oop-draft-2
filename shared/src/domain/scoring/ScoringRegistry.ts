import type { ScoringEngine } from "./ScoringEngine";
import { StandardStrokeEngine } from "./StandardStrokeEngine";
import { CTHDistanceEngine } from "./CTHDistanceEngine";
import { SuddenDeathEngine } from "./SuddenDeathEngine";

const engines: ScoringEngine<unknown>[] = [
  new StandardStrokeEngine(),
  new CTHDistanceEngine(),
  new SuddenDeathEngine()
];

export function getScoringEngine(model: string): ScoringEngine<unknown> {
  const engine = engines.find((e) => e.model === model);
  if (!engine) {
    throw new Error(`No scoring engine for model: ${model}`);
  }
  return engine;
}

export function getAvailableModels(): string[] {
  return engines.map((e) => e.model);
}
