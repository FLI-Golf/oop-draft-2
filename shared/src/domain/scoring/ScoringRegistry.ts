import { StandardStrokeEngine } from "./StandardStrokeEngine";
import { CTHDistanceEngine } from "./CTHDistanceEngine";

const engines = [
  new StandardStrokeEngine(),
  new CTHDistanceEngine()
];

export function getScoringEngine(model: string) {
  const engine = engines.find(e => e.model === model);
  if (!engine) {
    throw new Error(`No scoring engine for model: ${model}`);
  }
  return engine;
}
