import { describe, it, expect } from 'vitest';
import { TournamentService } from '../../services/TournamentService';
import { Tournament, TournamentStatus } from '../../Tournament';
import type { GroupScoreResult } from '../../scoring/ScoreResult';

describe('TournamentService - Playoff Functionality', () => {
  const service = new TournamentService();

  describe('completeRegularRound', () => {
    it('should finalize tournament when no playoff is needed', async () => {
      const tournament = new Tournament('t1', 'Spring Open', new Date(), '2026');
      tournament.status = TournamentStatus.IN_PROGRESS;
      
      const results: GroupScoreResult[] = [
        {
          groupId: 'group1',
          scoringModel: 'standard_match_total_strokes',
          results: [
            { teamId: 'team1', rank: 1, value: 54 },
            { teamId: 'team2', rank: 2, value: 60 }
          ]
        },
        {
          groupId: 'group2',
          scoringModel: 'standard_match_total_strokes',
          results: [
            { teamId: 'team3', rank: 1, value: 57 },
            { teamId: 'team4', rank: 2, value: 63 }
          ]
        }
      ];

      await service.completeRegularRound(tournament, results);
      
      expect(tournament.status).toBe(TournamentStatus.FINALIZED);
      expect(tournament.winner).toBe('team1'); // lowest total score
    });

    it('should require playoff when teams are tied', async () => {
      const tournament = new Tournament('t1', 'Spring Open', new Date(), '2026');
      tournament.status = TournamentStatus.IN_PROGRESS;
      
      const results: GroupScoreResult[] = [
        {
          groupId: 'group1',
          scoringModel: 'standard_match_total_strokes',
          results: [
            { teamId: 'team1', rank: 1, value: 54 },
            { teamId: 'team2', rank: 2, value: 60 }
          ]
        },
        {
          groupId: 'group2',
          scoringModel: 'standard_match_total_strokes',
          results: [
            { teamId: 'team3', rank: 1, value: 54 }, // tied with team1
            { teamId: 'team4', rank: 2, value: 63 }
          ]
        }
      ];

      await service.completeRegularRound(tournament, results);
      
      expect(tournament.status).toBe(TournamentStatus.PLAYOFF_REQUIRED);
      expect(tournament.winner).toBeUndefined();
    });
  });

  describe('createPlayoffGroup', () => {
    it('should create playoff group and start playoff', async () => {
      const tournament = new Tournament('t1', 'Spring Open', new Date(), '2026');
      tournament.status = TournamentStatus.PLAYOFF_REQUIRED;
      
      const playoffGroupId = await service.createPlayoffGroup(tournament, ['team1', 'team3']);
      
      expect(playoffGroupId).toBeDefined();
      expect(playoffGroupId).toContain('playoff');
      expect(tournament.playoffRound).toBe(playoffGroupId);
      expect(tournament.status).toBe(TournamentStatus.PLAYOFF_IN_PROGRESS);
    });

    it('should generate unique playoff group ids', async () => {
      const tournament = new Tournament('t1', 'Spring Open', new Date(), '2026');
      tournament.status = TournamentStatus.PLAYOFF_REQUIRED;
      
      const playoffGroupId1 = await service.createPlayoffGroup(tournament, ['team1', 'team2']);
      
      // Wait a tiny bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const tournament2 = new Tournament('t2', 'Summer Classic', new Date(), '2026');
      tournament2.status = TournamentStatus.PLAYOFF_REQUIRED;
      
      const playoffGroupId2 = await service.createPlayoffGroup(tournament2, ['team3', 'team4']);
      
      expect(playoffGroupId1).not.toBe(playoffGroupId2);
    });
  });

  describe('checkPlayoffWinner', () => {
    it('should return winner when one team has lowest score', async () => {
      const tournament = new Tournament('t1', 'Spring Open', new Date(), '2026');
      tournament.status = TournamentStatus.PLAYOFF_IN_PROGRESS;
      
      const playoffResults: GroupScoreResult = {
        groupId: 'playoff-1',
        scoringModel: 'playoff_sudden_death_hole',
        results: [
          { teamId: 'team1', rank: 1, value: 3 },
          { teamId: 'team3', rank: 2, value: 4 }
        ]
      };

      const winner = await service.checkPlayoffWinner(tournament, playoffResults);
      
      expect(winner).toBe('team1');
      expect(tournament.status).toBe(TournamentStatus.FINALIZED);
      expect(tournament.winner).toBe('team1');
    });

    it('should return null when teams are still tied', async () => {
      const tournament = new Tournament('t1', 'Spring Open', new Date(), '2026');
      tournament.status = TournamentStatus.PLAYOFF_IN_PROGRESS;
      
      const playoffResults: GroupScoreResult = {
        groupId: 'playoff-1',
        scoringModel: 'playoff_sudden_death_hole',
        results: [
          { teamId: 'team1', rank: 1, value: 3 },
          { teamId: 'team3', rank: 1, value: 3 } // still tied
        ]
      };

      const winner = await service.checkPlayoffWinner(tournament, playoffResults);
      
      expect(winner).toBeNull();
      expect(tournament.status).toBe(TournamentStatus.PLAYOFF_IN_PROGRESS);
      expect(tournament.winner).toBeUndefined();
    });

    it('should handle 3-way playoff with clear winner', async () => {
      const tournament = new Tournament('t1', 'Spring Open', new Date(), '2026');
      tournament.status = TournamentStatus.PLAYOFF_IN_PROGRESS;
      
      const playoffResults: GroupScoreResult = {
        groupId: 'playoff-1',
        scoringModel: 'playoff_sudden_death_hole',
        results: [
          { teamId: 'team1', rank: 1, value: 3 },
          { teamId: 'team3', rank: 2, value: 4 },
          { teamId: 'team5', rank: 3, value: 5 }
        ]
      };

      const winner = await service.checkPlayoffWinner(tournament, playoffResults);
      
      expect(winner).toBe('team1');
      expect(tournament.winner).toBe('team1');
    });

    it('should handle 3-way playoff where 2 teams remain tied', async () => {
      const tournament = new Tournament('t1', 'Spring Open', new Date(), '2026');
      tournament.status = TournamentStatus.PLAYOFF_IN_PROGRESS;
      
      const playoffResults: GroupScoreResult = {
        groupId: 'playoff-1',
        scoringModel: 'playoff_sudden_death_hole',
        results: [
          { teamId: 'team1', rank: 1, value: 3 },
          { teamId: 'team3', rank: 1, value: 3 }, // tied with team1
          { teamId: 'team5', rank: 3, value: 5 }
        ]
      };

      const winner = await service.checkPlayoffWinner(tournament, playoffResults);
      
      expect(winner).toBeNull();
      expect(tournament.status).toBe(TournamentStatus.PLAYOFF_IN_PROGRESS);
    });
  });

  describe('complete playoff workflow', () => {
    it('should handle full playoff workflow from tie to winner', async () => {
      const tournament = new Tournament('t1', 'Spring Open', new Date(), '2026');
      tournament.status = TournamentStatus.IN_PROGRESS;
      
      // Step 1: Regular round completes with tie
      const regularResults: GroupScoreResult[] = [
        {
          groupId: 'group1',
          scoringModel: 'standard_match_total_strokes',
          results: [
            { teamId: 'team1', rank: 1, value: 54 },
            { teamId: 'team2', rank: 2, value: 60 }
          ]
        },
        {
          groupId: 'group2',
          scoringModel: 'standard_match_total_strokes',
          results: [
            { teamId: 'team3', rank: 1, value: 54 },
            { teamId: 'team4', rank: 2, value: 63 }
          ]
        }
      ];

      await service.completeRegularRound(tournament, regularResults);
      expect(tournament.status).toBe(TournamentStatus.PLAYOFF_REQUIRED);
      
      // Step 2: Create playoff group
      const playoffGroupId = await service.createPlayoffGroup(tournament, ['team1', 'team3']);
      expect(tournament.status).toBe(TournamentStatus.PLAYOFF_IN_PROGRESS);
      expect(tournament.playoffRound).toBe(playoffGroupId);
      
      // Step 3: First playoff hole - still tied
      let playoffResults: GroupScoreResult = {
        groupId: playoffGroupId,
        scoringModel: 'playoff_sudden_death_hole',
        results: [
          { teamId: 'team1', rank: 1, value: 3 },
          { teamId: 'team3', rank: 1, value: 3 }
        ]
      };

      let winner = await service.checkPlayoffWinner(tournament, playoffResults);
      expect(winner).toBeNull();
      expect(tournament.status).toBe(TournamentStatus.PLAYOFF_IN_PROGRESS);
      
      // Step 4: Second playoff hole - team1 wins
      playoffResults = {
        groupId: playoffGroupId,
        scoringModel: 'playoff_sudden_death_hole',
        results: [
          { teamId: 'team1', rank: 1, value: 3 },
          { teamId: 'team3', rank: 2, value: 4 }
        ]
      };

      winner = await service.checkPlayoffWinner(tournament, playoffResults);
      expect(winner).toBe('team1');
      expect(tournament.status).toBe(TournamentStatus.FINALIZED);
      expect(tournament.winner).toBe('team1');
    });
  });
});
