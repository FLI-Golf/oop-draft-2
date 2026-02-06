import { Tournament, TournamentStatus } from '../Tournament';
import { GroupScoreResult } from '../scoring/ScoreResult';

export class TournamentService {
  
  // Call this after all regular round scores are entered
  async completeRegularRound(tournament: Tournament, results: GroupScoreResult[]): Promise<void> {
    tournament.status = TournamentStatus.COMPLETED;

    // Check if playoff is needed
    const tiedTeams = tournament.checkForPlayoff(results);
    
    if (tiedTeams) {
      tournament.requirePlayoff(tiedTeams);
      // TODO: Trigger UI to show playoff screen
      return;
    }

    // No playoff needed - finalize with winner
    const winner = this.determineWinner(results);
    if (winner) {
      tournament.finalize(winner);
    }
  }

  // Create playoff group with only tied teams
  async createPlayoffGroup(tournament: Tournament, tiedTeamIds: string[]): Promise<string> {
    const playoffGroupId = `playoff-${tournament.id}-${Date.now()}`;
    
    // Create playoff group using SuddenDeathEngine
    // Only include tiedTeamIds
    
    tournament.startPlayoff(playoffGroupId);
    return playoffGroupId;
  }

  // After each playoff hole, check if we have a winner
  async checkPlayoffWinner(tournament: Tournament, playoffResults: GroupScoreResult): Promise<string | null> {
    const results = playoffResults.results;
    
    // Sort by score
    results.sort((a, b) => a.value - b.value);
    
    const winningScore = results[0].value;
    const winners = results.filter(r => r.value === winningScore);
    
    if (winners.length === 1) {
      // We have a winner!
      const winnerId = winners[0].teamId;
      tournament.finalize(winnerId);
      return winnerId;
    }
    
    // Still tied - continue playoff
    return null;
  }

  private determineWinner(results: GroupScoreResult[]): string | null {
    // Calculate total scores and return winner
    const allTeamScores = new Map<string, number>();
    
    results.forEach(group => {
      group.results.forEach(teamResult => {
        const currentScore = allTeamScores.get(teamResult.teamId) || 0;
        allTeamScores.set(teamResult.teamId, currentScore + teamResult.value);
      });
    });

    const scores = Array.from(allTeamScores.entries());
    scores.sort((a, b) => a[1] - b[1]);
    
    return scores.length > 0 ? scores[0][0] : null;
  }
}
