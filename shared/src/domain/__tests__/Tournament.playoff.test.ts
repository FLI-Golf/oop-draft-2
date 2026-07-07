import { describe, it, expect } from 'vitest';
import { Tournament, TournamentStatus } from '../Tournament';
import type { GroupScoreResult } from '../scoring/ScoreResult';

describe('Tournament - Playoff Functionality', () => {
  describe('checkForPlayoff', () => {
    it('should return null when no playoff is needed (clear winner)', () => {
      const tournament = new Tournament('t1', 'Spring Open', new Date(), '2026');
      
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

      const tiedTeams = tournament.checkForPlayoff(results);
      
      expect(tiedTeams).toBeNull();
    });

    it('should detect a tie between 2 teams', () => {
      const tournament = new Tournament('t1', 'Spring Open', new Date(), '2026');
      
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

      const tiedTeams = tournament.checkForPlayoff(results);
      
      expect(tiedTeams).not.toBeNull();
      expect(tiedTeams).toHaveLength(2);
      expect(tiedTeams).toContain('team1');
      expect(tiedTeams).toContain('team3');
    });

    it('should detect a tie between 3 teams', () => {
      const tournament = new Tournament('t1', 'Spring Open', new Date(), '2026');
      
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
            { teamId: 'team4', rank: 2, value: 57 }
          ]
        },
        {
          groupId: 'group3',
          scoringModel: 'standard_match_total_strokes',
          results: [
            { teamId: 'team5', rank: 1, value: 54 }, // tied with team1 and team3
            { teamId: 'team6', rank: 2, value: 63 }
          ]
        }
      ];

      const tiedTeams = tournament.checkForPlayoff(results);
      
      expect(tiedTeams).not.toBeNull();
      expect(tiedTeams).toHaveLength(3);
      expect(tiedTeams).toContain('team1');
      expect(tiedTeams).toContain('team3');
      expect(tiedTeams).toContain('team5');
    });

    it('should return null with empty results', () => {
      const tournament = new Tournament('t1', 'Spring Open', new Date(), '2026');
      
      const tiedTeams = tournament.checkForPlayoff([]);
      
      expect(tiedTeams).toBeNull();
    });

    it('should handle single group result', () => {
      const tournament = new Tournament('t1', 'Spring Open', new Date(), '2026');
      
      const results: GroupScoreResult[] = [
        {
          groupId: 'group1',
          scoringModel: 'standard_match_total_strokes',
          results: [
            { teamId: 'team1', rank: 1, value: 54 },
            { teamId: 'team2', rank: 2, value: 60 }
          ]
        }
      ];

      const tiedTeams = tournament.checkForPlayoff(results);
      
      expect(tiedTeams).toBeNull();
    });
  });

  describe('requirePlayoff', () => {
    it('should set status to PLAYOFF_REQUIRED', () => {
      const tournament = new Tournament('t1', 'Spring Open', new Date(), '2026');
      tournament.status = TournamentStatus.COMPLETED;
      
      tournament.requirePlayoff(['team1', 'team2']);
      
      expect(tournament.status).toBe(TournamentStatus.PLAYOFF_REQUIRED);
    });
  });

  describe('startPlayoff', () => {
    it('should set playoff round and update status', () => {
      const tournament = new Tournament('t1', 'Spring Open', new Date(), '2026');
      tournament.status = TournamentStatus.PLAYOFF_REQUIRED;
      
      tournament.startPlayoff('playoff-group-1');
      
      expect(tournament.playoffRound).toBe('playoff-group-1');
      expect(tournament.status).toBe(TournamentStatus.PLAYOFF_IN_PROGRESS);
    });
  });

  describe('finalize', () => {
    it('should set winner and status to FINALIZED', () => {
      const tournament = new Tournament('t1', 'Spring Open', new Date(), '2026');
      tournament.status = TournamentStatus.COMPLETED;
      
      tournament.finalize('team1');
      
      expect(tournament.winner).toBe('team1');
      expect(tournament.status).toBe(TournamentStatus.FINALIZED);
    });

    it('should work after playoff', () => {
      const tournament = new Tournament('t1', 'Spring Open', new Date(), '2026');
      tournament.status = TournamentStatus.PLAYOFF_IN_PROGRESS;
      tournament.playoffRound = 'playoff-group-1';
      
      tournament.finalize('team2');
      
      expect(tournament.winner).toBe('team2');
      expect(tournament.status).toBe(TournamentStatus.FINALIZED);
    });
  });

  describe('canFinalize', () => {
    it('should return true when status is COMPLETED', () => {
      const tournament = new Tournament('t1', 'Spring Open', new Date(), '2026');
      tournament.status = TournamentStatus.COMPLETED;
      
      expect(tournament.canFinalize()).toBe(true);
    });

    it('should return true when status is PLAYOFF_IN_PROGRESS', () => {
      const tournament = new Tournament('t1', 'Spring Open', new Date(), '2026');
      tournament.status = TournamentStatus.PLAYOFF_IN_PROGRESS;
      
      expect(tournament.canFinalize()).toBe(true);
    });

    it('should return false when status is SETUP', () => {
      const tournament = new Tournament('t1', 'Spring Open', new Date(), '2026');
      tournament.status = TournamentStatus.SETUP;
      
      expect(tournament.canFinalize()).toBe(false);
    });

    it('should return false when status is IN_PROGRESS', () => {
      const tournament = new Tournament('t1', 'Spring Open', new Date(), '2026');
      tournament.status = TournamentStatus.IN_PROGRESS;
      
      expect(tournament.canFinalize()).toBe(false);
    });

    it('should return false when status is PLAYOFF_REQUIRED', () => {
      const tournament = new Tournament('t1', 'Spring Open', new Date(), '2026');
      tournament.status = TournamentStatus.PLAYOFF_REQUIRED;
      
      expect(tournament.canFinalize()).toBe(false);
    });
  });

  describe('playoff workflow integration', () => {
    it('should handle complete playoff workflow', () => {
      const tournament = new Tournament('t1', 'Spring Open', new Date(), '2026');
      
      // 1. Tournament completed with tied scores
      tournament.status = TournamentStatus.COMPLETED;
      
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
      
      // 2. Detect playoff needed
      const tiedTeams = tournament.checkForPlayoff(results);
      expect(tiedTeams).toEqual(['team1', 'team3']);
      
      // 3. Mark playoff required
      tournament.requirePlayoff(tiedTeams!);
      expect(tournament.status).toBe(TournamentStatus.PLAYOFF_REQUIRED);
      
      // 4. Start playoff
      tournament.startPlayoff('playoff-123');
      expect(tournament.status).toBe(TournamentStatus.PLAYOFF_IN_PROGRESS);
      expect(tournament.playoffRound).toBe('playoff-123');
      
      // 5. Playoff completes, finalize winner
      expect(tournament.canFinalize()).toBe(true);
      tournament.finalize('team1');
      expect(tournament.status).toBe(TournamentStatus.FINALIZED);
      expect(tournament.winner).toBe('team1');
    });
  });
});
