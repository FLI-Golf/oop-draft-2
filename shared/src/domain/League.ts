import { Team } from "./Team";
import { Player } from "./Player";

/**
 * League represents the FLI Golf league structure.
 * 
 * Fixed composition:
 * - 12 teams
 * - 24 players total (12 male, 12 female)
 * - Each team has 1 male + 1 female player
 * - Results and payouts are team-based
 */
export class League {
  static readonly TEAM_COUNT = 12;
  static readonly PLAYER_COUNT = 24;
  static readonly MALE_COUNT = 12;
  static readonly FEMALE_COUNT = 12;

  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly season: string,
    public readonly teams: Team[]
  ) {
    if (!id || !name || !season) {
      throw new Error("League requires id, name, and season");
    }

    if (teams.length !== League.TEAM_COUNT) {
      throw new Error(`League must have exactly ${League.TEAM_COUNT} teams`);
    }

    // Validate unique players
    const playerIds = new Set<string>();
    for (const team of teams) {
      for (const player of team.players) {
        if (playerIds.has(player.id)) {
          throw new Error(`Duplicate player in league: ${player.id}`);
        }
        playerIds.add(player.id);
      }
    }

    if (playerIds.size !== League.PLAYER_COUNT) {
      throw new Error(`League must have exactly ${League.PLAYER_COUNT} unique players`);
    }
  }

  /**
   * All players in the league
   */
  get players(): Player[] {
    return this.teams.flatMap((t) => t.players);
  }

  /**
   * All male players
   */
  get malePlayers(): Player[] {
    return this.teams.map((t) => t.malePlayer);
  }

  /**
   * All female players
   */
  get femalePlayers(): Player[] {
    return this.teams.map((t) => t.femalePlayer);
  }

  /**
   * Find team by player ID
   */
  getTeamByPlayer(playerId: string): Team | undefined {
    return this.teams.find((t) => t.hasPlayer(playerId));
  }

  /**
   * Find team by ID
   */
  getTeam(teamId: string): Team | undefined {
    return this.teams.find((t) => t.id === teamId);
  }
}
