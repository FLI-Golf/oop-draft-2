// Scoring engines
export { StandardStrokeEngine, type StrokeScoreInput } from "./StandardStrokeEngine";
export { CTHDistanceEngine, type CTHScoreInput } from "./CTHDistanceEngine";
export { SuddenDeathEngine, type SuddenDeathInput } from "./SuddenDeathEngine";

// Core interfaces and types
export type { ScoringEngine } from "./ScoringEngine";
export type { ScoringModel } from "./ScoringModel";
export type { GroupScoreResult, TeamScoreResult } from "./ScoreResult";

// Registry and entry point
export { getScoringEngine, getAvailableModels } from "./ScoringRegistry";
export { scoreGroup, type ScoreGroupInput } from "./scoreGroup";
