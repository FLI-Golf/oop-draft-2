/**
 * TournamentSettings defines the format and scheduling for a tournament.
 * 
 * Default format: All groups start at hole 1 with 10-minute intervals.
 */
export class TournamentSettings {
  /** Starting hole for all groups (default: 1) */
  readonly startingHole: number;

  /** Minutes between group tee times (default: 10) */
  readonly intervalMinutes: number;

  /** First tee time of the day */
  readonly firstTeeTime: string; // HH:MM format

  /** Tournament format identifier */
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

    if (!/^\d{2}:\d{2}$/.test(firstTeeTime)) {
      throw new Error("First tee time must be in HH:MM format");
    }

    this.startingHole = startingHole;
    this.intervalMinutes = intervalMinutes;
    this.firstTeeTime = firstTeeTime;
    this.format = format;
  }

  /**
   * Calculate tee time for a group based on their position in the order.
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
 * - stroke: Traditional stroke play (lowest total score wins)
 * - match: Match play (hole-by-hole competition)
 * - skins: Skins game (win hole outright to claim skin)
 * - bestball: Team best ball
 */
export type TournamentFormat = "stroke" | "match" | "skins" | "bestball";
