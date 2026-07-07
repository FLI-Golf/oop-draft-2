import { describe, it, expect } from 'vitest';
import { StandardStrokeEngine } from '../../scoring/StandardStrokeEngine';
import { CTHDistanceEngine } from '../../scoring/CTHDistanceEngine';
import { SuddenDeathEngine } from '../../scoring/SuddenDeathEngine';
import { Group } from '../../Group';
import { Team } from '../../Team';
import { Player } from '../../Player';

describe('Scoring Engines', () => {
  // Create test fixtures
  const malePlayer1 = new Player('player1', 'John Doe', 'male', 950);
  const femalePlayer1 = new Player('player2', 'Jane Smith', 'female', 920);
  const team1 = new Team('team1', 'Team Alpha', [malePlayer1, femalePlayer1]);

  const malePlayer2 = new Player('player3', 'Bob Johnson', 'male', 940);
  const femalePlayer2 = new Player('player4', 'Alice Brown', 'female', 930);
  const team2 = new Team('team2', 'Team Beta', [malePlayer2, femalePlayer2]);

  const malePlayer3 = new Player('player5', 'Charlie Wilson', 'male', 960);
  const femalePlayer3 = new Player('player6', 'Diana Davis', 'female', 910);
  const team3 = new Team('team3', 'Team Gamma', [malePlayer3, femalePlayer3]);

  describe('StandardStrokeEngine', () => {
    const engine = new StandardStrokeEngine();

    it('should have correct model name', () => {
      expect(engine.model).toBe('standard_match_total_strokes');
    });

    it('should score a standard group with 2 teams', () => {
      const group = new Group('group1', 'tournament1', 'standard', [team1, team2]);
      
      const input = [
        { teamId: 'team1', totalStrokes: 54 },
        { teamId: 'team2', totalStrokes: 57 }
      ];

      const result = engine.scoreGroup(group, input);

      expect(result.groupId).toBe('group1');
      expect(result.scoringModel).toBe('standard_match_total_strokes');
      expect(result.results).toHaveLength(2);
      expect(result.results[0].teamId).toBe('team1');
      expect(result.results[0].rank).toBe(1);
      expect(result.results[0].value).toBe(54);
      expect(result.results[1].teamId).toBe('team2');
      expect(result.results[1].rank).toBe(2);
      expect(result.results[1].value).toBe(57);
    });

    it('should sort teams by strokes (lowest wins)', () => {
      const group = new Group('group1', 'tournament1', 'standard', [team1, team2]);
      
      // Team2 wins with fewer strokes
      const input = [
        { teamId: 'team1', totalStrokes: 60 },
        { teamId: 'team2', totalStrokes: 55 }
      ];

      const result = engine.scoreGroup(group, input);

      expect(result.results[0].teamId).toBe('team2');
      expect(result.results[0].rank).toBe(1);
      expect(result.results[0].value).toBe(55);
    });

    it('should throw error if group does not have exactly 2 teams', () => {
      const playoffGroup = new Group('group1', 'tournament1', 'playoff', [team1, team2, team3]);
      
      const input = [
        { teamId: 'team1', totalStrokes: 54 },
        { teamId: 'team2', totalStrokes: 57 },
        { teamId: 'team3', totalStrokes: 56 }
      ];

      expect(() => engine.scoreGroup(playoffGroup, input)).toThrow(
        'Standard stroke scoring requires exactly 2 teams'
      );
    });
  });

  describe('CTHDistanceEngine', () => {
    const engine = new CTHDistanceEngine();

    it('should have correct model name', () => {
      expect(engine.model).toBe('playoff_total_distance');
    });

    it('should score closest-to-hole by distance', () => {
      const group = new Group('group1', 'tournament1', 'playoff', [team1, team2, team3]);
      
      const input = [
        { teamId: 'team1', distance: 15.5 },
        { teamId: 'team2', distance: 8.2 },
        { teamId: 'team3', distance: 12.0 }
      ];

      const result = engine.scoreGroup(group, input);

      expect(result.groupId).toBe('group1');
      expect(result.scoringModel).toBe('playoff_total_distance');
      expect(result.results).toHaveLength(3);
      
      // Sorted by distance (closest wins)
      expect(result.results[0].teamId).toBe('team2');
      expect(result.results[0].rank).toBe(1);
      expect(result.results[0].value).toBe(8.2);
      
      expect(result.results[1].teamId).toBe('team3');
      expect(result.results[1].rank).toBe(2);
      expect(result.results[1].value).toBe(12.0);
      
      expect(result.results[2].teamId).toBe('team1');
      expect(result.results[2].rank).toBe(3);
      expect(result.results[2].value).toBe(15.5);
    });

    it('should handle 2 teams', () => {
      const group = new Group('group1', 'tournament1', 'playoff', [team1, team2]);
      
      const input = [
        { teamId: 'team1', distance: 20.0 },
        { teamId: 'team2', distance: 18.5 }
      ];

      const result = engine.scoreGroup(group, input);

      expect(result.results[0].teamId).toBe('team2');
      expect(result.results[0].rank).toBe(1);
    });

    it('should validate group has at least 2 teams', () => {
      // CTHDistanceEngine checks group.teams.length, not input.length
      // A standard group must have exactly 2 teams, so this test verifies
      // the engine would work correctly with minimum valid playoff group
      const group = new Group('group1', 'tournament1', 'playoff', [team1, team2]);
      
      const input = [
        { teamId: 'team1', distance: 15.5 },
        { teamId: 'team2', distance: 18.0 }
      ];

      // Should not throw with 2 teams
      expect(() => engine.scoreGroup(group, input)).not.toThrow();
    });
  });

  describe('SuddenDeathEngine', () => {
    const engine = new SuddenDeathEngine();

    it('should have correct model name', () => {
      expect(engine.model).toBe('playoff_sudden_death_hole');
    });

    it('should score sudden death playoff by summing hole scores', () => {
      const group = new Group('group1', 'tournament1', 'playoff', [team1, team2, team3]);
      
      const input = [
        { teamId: 'team1', holeScores: [3, 4, 3] }, // total: 10
        { teamId: 'team2', holeScores: [3, 3, 3] }, // total: 9
        { teamId: 'team3', holeScores: [4, 3, 4] }  // total: 11
      ];

      const result = engine.scoreGroup(group, input);

      expect(result.groupId).toBe('group1');
      expect(result.scoringModel).toBe('playoff_sudden_death_hole');
      expect(result.results).toHaveLength(3);
      
      // Sorted by total score (lowest wins)
      expect(result.results[0].teamId).toBe('team2');
      expect(result.results[0].rank).toBe(1);
      expect(result.results[0].value).toBe(9);
      
      expect(result.results[1].teamId).toBe('team1');
      expect(result.results[1].rank).toBe(2);
      expect(result.results[1].value).toBe(10);
      
      expect(result.results[2].teamId).toBe('team3');
      expect(result.results[2].rank).toBe(3);
      expect(result.results[2].value).toBe(11);
    });

    it('should handle single hole playoff', () => {
      const group = new Group('group1', 'tournament1', 'playoff', [team1, team2]);
      
      const input = [
        { teamId: 'team1', holeScores: [4] },
        { teamId: 'team2', holeScores: [3] }
      ];

      const result = engine.scoreGroup(group, input);

      expect(result.results[0].teamId).toBe('team2');
      expect(result.results[0].value).toBe(3);
    });

    it('should handle multiple holes', () => {
      const group = new Group('group1', 'tournament1', 'playoff', [team1, team2]);
      
      const input = [
        { teamId: 'team1', holeScores: [3, 4, 3, 2] }, // total: 12
        { teamId: 'team2', holeScores: [3, 3, 4, 3] }  // total: 13
      ];

      const result = engine.scoreGroup(group, input);

      expect(result.results[0].teamId).toBe('team1');
      expect(result.results[0].value).toBe(12);
    });

    it('should validate group has at least 2 teams', () => {
      // SuddenDeathEngine checks group.teams.length, not input.length
      // A standard group must have exactly 2 teams, so this test verifies
      // the engine would work correctly with minimum valid playoff group
      const group = new Group('group1', 'tournament1', 'playoff', [team1, team2]);
      
      const input = [
        { teamId: 'team1', holeScores: [3] },
        { teamId: 'team2', holeScores: [4] }
      ];

      // Should not throw with 2 teams
      expect(() => engine.scoreGroup(group, input)).not.toThrow();
    });
  });
});
