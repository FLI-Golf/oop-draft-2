export type TeamScoreResult = {
  teamId: string;
  rank: number;        // 1 = winner
  value: number;       // strokes or distance
};

export type GroupScoreResult = {
  groupId: string;
  scoringModel: string;
  results: TeamScoreResult[];
};
