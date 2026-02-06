/**
 * UI Integration Example for Tournament Playoff Flow
 * 
 * This file demonstrates how to integrate the tournament service
 * with your UI components. Copy relevant patterns to your actual
 * UI implementation.
 */

import { Tournament, TournamentStatus } from '../shared/src/domain/Tournament';
import { TournamentService } from '../shared/src/domain/services/TournamentService';
import { GroupScoreResult } from '../shared/src/domain/scoring/ScoreResult';

// Example: Scoring Component Handler
async function handleCompleteScoring(
  tournament: Tournament,
  tournamentService: TournamentService,
  calculateAllResults: () => Promise<GroupScoreResult[]>,
  showPlayoffScreen: (tiedTeams: string[] | null) => void,
  showWinnerScreen: (winnerId: string | undefined) => void
) {
  const results = await calculateAllResults();
  await tournamentService.completeRegularRound(tournament, results);
  
  if (tournament.status === TournamentStatus.PLAYOFF_REQUIRED) {
    // Show playoff UI
    const tiedTeams = tournament.checkForPlayoff(results);
    showPlayoffScreen(tiedTeams);
  } else if (tournament.status === TournamentStatus.FINALIZED) {
    // Show winner
    showWinnerScreen(tournament.winner);
  }
}

// Example: Playoff Scoring Handler
async function handlePlayoffHoleComplete(
  tournament: Tournament,
  tournamentService: TournamentService,
  holeResults: GroupScoreResult,
  showWinnerScreen: (winnerId: string) => void,
  showNextPlayoffHole: () => void
) {
  const winner = await tournamentService.checkPlayoffWinner(tournament, holeResults);
  
  if (winner) {
    showWinnerScreen(winner);
  } else {
    // Continue to next playoff hole
    showNextPlayoffHole();
  }
}

// Example: Create Playoff Round Handler
async function handleCreatePlayoff(
  tournament: Tournament,
  tournamentService: TournamentService,
  tiedTeamIds: string[],
  navigateToPlayoffScoring: (playoffGroupId: string) => void
) {
  const playoffGroupId = await tournamentService.createPlayoffGroup(tournament, tiedTeamIds);
  
  // Navigate to playoff scoring screen with only tied teams
  navigateToPlayoffScoring(playoffGroupId);
}

export {
  handleCompleteScoring,
  handlePlayoffHoleComplete,
  handleCreatePlayoff
};
