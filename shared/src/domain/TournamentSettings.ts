/**
 * TournamentSettings defines the scheduling and scoring behavior for a tournament.
 *
 * Scheduling defaults:
 * - All groups start at hole 1
 * - 10-minute intervals
 * - First tee time at 08:00
 *
 * Demo note:
 * - The tournament `format` defaults to "stroke".
 * - "cth" (Closest to the Hole) is primarily intended for a one-throw playoff system.
 *   For full fidelity, store CTH playoff attempts (distance-to-pin) separately from stroke scoring.
 */
export class TournamentSettings {
  /** Starting hole for all groups (default: 1) */
  readonly startingHole: number;

  /** Minutes between group tee times (default: 10) */
  readonly intervalMinutes: number;

  /** First tee time of the day (HH:MM) */
  readonly firstTeeTime: string;

  /**
   * Tournament format identifier.
   * - Defaults to "stroke" for regular tournament play.
   * - "cth" is supported but is typically used as a one-throw playoff format.
   */
  readonly format: TournamentFormat;

  static readonly DEFAULT_STARTING_HOLE = 1;
  static readonly DEFAULT_INTERVAL_MINUTES = 10;
  static readonly DEFAULT_FIRST_TEE_TIME = "08:00";
  static readonly DEFAULT_FORMAT: TournamentFormat = "stroke";

  constructor(params?: {
    startingHole?: number;
    intervalMinutes?: number;
    firstTeeTime?: string;
    format?: TournamentFormat;
  }) {
    const {
      startingHole = TournamentSettings.DEFAULT_STARTING_HOLE,
      intervalMinutes = TournamentSettings.DEFAULT_INTERVAL_MINUTES,
      firstTeeTime = TournamentSettings.DEFAULT_FIRST_TEE_TIME,
      format = TournamentSettings.DEFAULT_FORMAT
    } = params ?? {};

    if (startingHole < 1 || startingHole > 9) {
      throw new Error("Starting hole must be between 1 and 9");
    }

    if (intervalMinutes < 5 || intervalMinutes > 30) {
      throw new Error("Interval must be between 5 and 30 minutes");
    }

    // Basic HH:MM validation (24-hour clock). Keeps the demo simple.
    if (!/^\d{2}:\d{2}$/.test(firstTeeTime)) {
      throw new Error("First tee time must be in HH:MM format");
    }

    this.startingHole = startingHole;
    this.intervalMinutes = intervalMinutes;
    this.firstTeeTime = firstTeeTime;
    this.format = format;
  }

  /**
   * Calculate tee time for a group based on its position in the order.
   * @param groupIndex 0-based index of the group
   * @returns Tee time in HH:MM format
   */
  getTeeTimeForGroup(groupIndex: number): string {
    const [hours, minutes] = this.firstTeeTime.split(":").map(Number);
    const totalMinutes = hours * 60 + minutes + groupIndex * this.intervalMinutes;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMinutes = totalMinutes % 60;
    return `${String(newHours).padStart(2, "0")}:${String(newMinutes).padStart(2, "0")}`;
  }
}

/**
 * Tournament format types:
 *
 * - stroke:
 *   Traditional individual stroke play.
 *   Lowest total number of throws across all holes wins.
 *
 * - match:
 *   Match play format.
 *   Players (or teams) compete hole-by-hole; each hole is won independently.
 *
 * - skins:
 *   Skins game.
 *   A player (or team) must win a hole outright to earn a skin; ties typically carry over.
 *
 * - bestball:
 *   Team best ball.
 *   On each hole, the best score among team members is used as the team score.
 *
 * - cth:
 *   Closest to the Hole.
 *   Intended for distance-based scoring (e.g., one-throw playoff).
 *   Requires capturing distance-to-pin (cannot be derived from stroke throws).
 *
 * - team_play:
 *   Team aggregate scoring.
 *   Team score is the sum of all team members’ scores across holes
 *   (unless otherwise specified by tournament rules).
 */
export type TournamentFormat =
  | "stroke"
  | "match"
  | "skins"
  | "bestball"
  | "cth"
  | "team_play";

export type ScoringModel =
  | "standard_match_total_strokes"
  | "playoff_total_distance"
  | "playoff_sudden_death_hole";
