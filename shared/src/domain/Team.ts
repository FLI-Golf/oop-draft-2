import { Player } from "./Player";

/**
 * Team represents a paired unit in the FLI Golf league.
 * 
 * Composition rules:
 * - Exactly 2 rostered players per team (not reserves)
 * - 1 male player + 1 female player
 * - Results and payouts are team-based, not individual
 * 
 * Note: Reserve players are NOT on teams. They fill in for
 * rostered players when needed (injury, absence, etc.)
 */
export class Team {
  readonly malePlayer: Player;
  readonly femalePlayer: Player;

  constructor(
    public readonly id: string,
    public readonly name: string,
    players: [Player, Player],
    public readonly teamEarnings: number = 0,
    public readonly teamPoints: number = 0
  ) {
    if (!id || !name) {
      throw new Error("Team requires id and name");
    }

    const male = players.find((p) => p.gender === "male");
    const female = players.find((p) => p.gender === "female");

    if (!male || !female) {
      throw new Error("Team must have exactly 1 male and 1 female player");
    }

    if (players.length !== 2) {
      throw new Error("Team must have exactly 2 players");
    }

    // Reserves should not be assigned to teams
    if (male.isReserve || female.isReserve) {
      throw new Error("Reserve players cannot be assigned to teams");
    }

    this.malePlayer = male;
    this.femalePlayer = female;
  }

  get players(): [Player, Player] {
    return [this.malePlayer, this.femalePlayer];
  }

  hasPlayer(playerId: string): boolean {
    return this.malePlayer.id === playerId || this.femalePlayer.id === playerId;
  }

  /**
   * Combined rating of both players
   */
  get combinedRating(): number {
    const maleRating = this.malePlayer.rating ?? 0;
    const femaleRating = this.femalePlayer.rating ?? 0;
    return maleRating + femaleRating;
  }

  /**
   * Average rating of both players
   */
  get averageRating(): number {
    return this.combinedRating / 2;
  }
}
