import { GroupScoreResult } from './scoring/ScoreResult';

export enum TournamentStatus {
  SETUP = 'SETUP',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  PLAYOFF_REQUIRED = 'PLAYOFF_REQUIRED',
  PLAYOFF_IN_PROGRESS = 'PLAYOFF_IN_PROGRESS',
  FINALIZED = 'FINALIZED'
}

export class Tournament {
  public status: TournamentStatus = TournamentStatus.SETUP;
  public playoffRound?: string; // groupId of playoff round
  public winner?: string; // teamId of tournament winner

  constructor(
    public id: string,
    public name: string,
    public date: Date,
    public season?: string
  ) {}

  // Check if tournament results show a tie for first place
  checkForPlayoff(results: GroupScoreResult[]): string[] | null {
    if (results.length === 0) return null;

    // Get all team scores across all groups
    const allTeamScores = new Map<string, number>();
    
    results.forEach(group => {
      group.results.forEach(teamResult => {
        const currentScore = allTeamScores.get(teamResult.teamId) || 0;
        allTeamScores.set(teamResult.teamId, currentScore + teamResult.value);
      });
    });

    // Find winning score (lowest for stroke play)
    const scores = Array.from(allTeamScores.entries());
    scores.sort((a, b) => a[1] - b[1]);
    
    if (scores.length === 0) return null;

    const winningScore = scores[0][1];
    const tiedTeams = scores
      .filter(([_, score]) => score === winningScore)
      .map(([teamId, _]) => teamId);

    // Playoff needed if more than 1 team has winning score
    return tiedTeams.length > 1 ? tiedTeams : null;
  }

  // Mark that playoff is required
  requirePlayoff(tiedTeamIds: string[]): void {
    this.status = TournamentStatus.PLAYOFF_REQUIRED;
    console.log(`Playoff required for teams: ${tiedTeamIds.join(', ')}`);
  }

  // Start playoff round
  startPlayoff(playoffGroupId: string): void {
    this.playoffRound = playoffGroupId;
    this.status = TournamentStatus.PLAYOFF_IN_PROGRESS;
  }

  // Finalize tournament with winner
  finalize(winnerId: string): void {
    this.winner = winnerId;
    this.status = TournamentStatus.FINALIZED;
  }

  // Check if tournament can be finalized
  canFinalize(): boolean {
    return this.status === TournamentStatus.COMPLETED || 
           this.status === TournamentStatus.PLAYOFF_IN_PROGRESS;
  }
}
