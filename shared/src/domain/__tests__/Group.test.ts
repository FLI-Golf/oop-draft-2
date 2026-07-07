import { describe, it, expect } from 'vitest';
import { Group } from '../Group';
import { Team } from '../Team';
import { Player } from '../Player';

describe('Group - Playoff Functionality', () => {
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

  const malePlayer4 = new Player('player7', 'David Miller', 'male', 935);
  const femalePlayer4 = new Player('player8', 'Eva Martinez', 'female', 925);
  const team4 = new Team('team4', 'Team Delta', [malePlayer4, femalePlayer4]);

  describe('standard groups', () => {
    it('should create a standard group with exactly 2 teams', () => {
      const group = new Group('group1', 'tournament1', 'standard', [team1, team2]);
      
      expect(group.id).toBe('group1');
      expect(group.tournamentId).toBe('tournament1');
      expect(group.stage).toBe('standard');
      expect(group.teams).toHaveLength(2);
      expect(group.size).toBe(2);
    });

    it('should throw error if standard group has less than 2 teams', () => {
      expect(() => new Group('group1', 'tournament1', 'standard', [team1])).toThrow(
        'Standard group must have exactly 2 teams'
      );
    });

    it('should throw error if standard group has more than 2 teams', () => {
      expect(() => new Group('group1', 'tournament1', 'standard', [team1, team2, team3])).toThrow(
        'Standard group must have exactly 2 teams'
      );
    });
  });

  describe('playoff groups', () => {
    it('should create a playoff group with 2 teams', () => {
      const group = new Group('playoff1', 'tournament1', 'playoff', [team1, team2]);
      
      expect(group.id).toBe('playoff1');
      expect(group.stage).toBe('playoff');
      expect(group.teams).toHaveLength(2);
      expect(group.size).toBe(2);
    });

    it('should create a playoff group with 3 teams', () => {
      const group = new Group('playoff1', 'tournament1', 'playoff', [team1, team2, team3]);
      
      expect(group.teams).toHaveLength(3);
      expect(group.size).toBe(3);
    });

    it('should create a playoff group with 4 teams (maximum)', () => {
      const group = new Group('playoff1', 'tournament1', 'playoff', [team1, team2, team3, team4]);
      
      expect(group.teams).toHaveLength(4);
      expect(group.size).toBe(4);
    });

    it('should throw error if playoff group has less than 2 teams', () => {
      expect(() => new Group('playoff1', 'tournament1', 'playoff', [team1])).toThrow(
        'Playoff group must have 2-4 teams'
      );
    });

    it('should throw error if playoff group has more than 4 teams', () => {
      const malePlayer5 = new Player('player9', 'Frank Garcia', 'male', 945);
      const femalePlayer5 = new Player('player10', 'Grace Lee', 'female', 915);
      const team5 = new Team('team5', 'Team Epsilon', [malePlayer5, femalePlayer5]);

      expect(() => new Group('playoff1', 'tournament1', 'playoff', [team1, team2, team3, team4, team5])).toThrow(
        'Playoff group must have 2-4 teams'
      );
    });

    it('should accept optional round parameter', () => {
      const group = new Group('playoff1', 'tournament1', 'playoff', [team1, team2], 1);
      
      expect(group.round).toBe(1);
    });

    it('should work without round parameter', () => {
      const group = new Group('playoff1', 'tournament1', 'playoff', [team1, team2]);
      
      expect(group.round).toBeUndefined();
    });
  });

  describe('validation', () => {
    it('should throw error if id is empty', () => {
      expect(() => new Group('', 'tournament1', 'standard', [team1, team2])).toThrow(
        'Group requires an id'
      );
    });

    it('should throw error if tournamentId is empty', () => {
      expect(() => new Group('group1', '', 'standard', [team1, team2])).toThrow(
        'Group requires a tournamentId'
      );
    });
  });

  describe('size property', () => {
    it('should return correct size for standard group', () => {
      const group = new Group('group1', 'tournament1', 'standard', [team1, team2]);
      
      expect(group.size).toBe(2);
    });

    it('should return correct size for playoff group with 3 teams', () => {
      const group = new Group('playoff1', 'tournament1', 'playoff', [team1, team2, team3]);
      
      expect(group.size).toBe(3);
    });
  });
});
