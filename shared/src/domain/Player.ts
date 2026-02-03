/**
 * Gender for FLI Golf league composition.
 * Each team requires 1 male and 1 female player.
 */
export type Gender = "male" | "female";

/**
 * Player represents a pro in FLI Golf tournaments.
 * 
 * League structure:
 * - 24 rostered pros (12 male, 12 female) assigned to 12 teams
 * - 4 reserve pros (2 male, 2 female) NOT assigned to teams
 * - Reserves fill in when a rostered player is unavailable
 * - Results are team-based, not individual
 * 
 * Ratings:
 * - Rating is PDGA-style rating (higher = better, typically 850-1050+)
 * - World ranking is competitive ranking (1 = best)
 */
export class Player {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly gender: Gender,
    public readonly rating?: number,
    public readonly worldRanking?: number,
    public readonly active: boolean = true,
    public readonly isReserve: boolean = false,
    public readonly email?: string
  ) {
    if (!id || !name) {
      throw new Error("Player requires id and name");
    }

    if (gender !== "male" && gender !== "female") {
      throw new Error("Player gender must be 'male' or 'female'");
    }

    if (rating !== undefined && (rating < 0 || rating > 1200)) {
      throw new Error("Rating must be between 0 and 1200");
    }

    if (worldRanking !== undefined && worldRanking < 1) {
      throw new Error("World ranking must be at least 1");
    }
  }
}
