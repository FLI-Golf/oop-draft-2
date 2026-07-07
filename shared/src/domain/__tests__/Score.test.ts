import { describe, it, expect } from 'vitest';
import { Score } from '../Score';
import { Player } from '../Player';
import { RoundHole } from '../RoundHole';
import { HoleLayout } from '../HoleLayout';
import { CourseHole } from '../CourseHole';

describe('Score', () => {
  // Create test fixtures
  const player = new Player('player1', 'John Doe', 'male', 950);
  const courseHole = new CourseHole(1);
  const holeLayout = new HoleLayout({
    hole: courseHole,
    basketPosition: 'A',
    distance: 250,
    par: 3
  });
  const roundHole = new RoundHole(1, holeLayout);

  describe('constructor', () => {
    it('should create a valid score', () => {
      const score = new Score(player, roundHole, 3);
      
      expect(score.player).toBe(player);
      expect(score.hole).toBe(roundHole);
      expect(score.strokes).toBe(3);
    });

    it('should throw error for invalid strokes (too low)', () => {
      expect(() => new Score(player, roundHole, 0)).toThrow(
        'Strokes must be between 1 and 10'
      );
    });

    it('should throw error for invalid strokes (too high)', () => {
      expect(() => new Score(player, roundHole, 11)).toThrow(
        'Strokes must be between 1 and 10'
      );
    });

    it('should accept minimum valid strokes', () => {
      const score = new Score(player, roundHole, 1);
      expect(score.strokes).toBe(1);
    });

    it('should accept maximum valid strokes', () => {
      const score = new Score(player, roundHole, 10);
      expect(score.strokes).toBe(10);
    });
  });

  describe('toPar', () => {
    it('should calculate negative score for under par (eagle)', () => {
      const score = new Score(player, roundHole, 1); // 1 on par 3
      expect(score.toPar).toBe(-2);
    });

    it('should calculate negative score for under par (birdie)', () => {
      const score = new Score(player, roundHole, 2); // 2 on par 3
      expect(score.toPar).toBe(-1);
    });

    it('should calculate zero for par', () => {
      const score = new Score(player, roundHole, 3); // 3 on par 3
      expect(score.toPar).toBe(0);
    });

    it('should calculate positive score for over par (bogey)', () => {
      const score = new Score(player, roundHole, 4); // 4 on par 3
      expect(score.toPar).toBe(1);
    });

    it('should calculate positive score for over par (double bogey)', () => {
      const score = new Score(player, roundHole, 5); // 5 on par 3
      expect(score.toPar).toBe(2);
    });
  });

  describe('toParName', () => {
    it('should return "Eagle" for 2 under par', () => {
      const score = new Score(player, roundHole, 1);
      expect(score.toParName).toBe('Eagle');
    });

    it('should return "Birdie" for 1 under par', () => {
      const score = new Score(player, roundHole, 2);
      expect(score.toParName).toBe('Birdie');
    });

    it('should return "Par" for even par', () => {
      const score = new Score(player, roundHole, 3);
      expect(score.toParName).toBe('Par');
    });

    it('should return "Bogey" for 1 over par', () => {
      const score = new Score(player, roundHole, 4);
      expect(score.toParName).toBe('Bogey');
    });

    it('should return "Double Bogey" for 2 over par', () => {
      const score = new Score(player, roundHole, 5);
      expect(score.toParName).toBe('Double Bogey');
    });

    it('should return "+3" for 3 over par', () => {
      const score = new Score(player, roundHole, 6);
      expect(score.toParName).toBe('+3');
    });

    it('should return "+4" for 4 over par', () => {
      const score = new Score(player, roundHole, 7);
      expect(score.toParName).toBe('+4');
    });
  });
});
