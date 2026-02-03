import { Player } from "./Player";

/**
 * Group represents players who play together during a tournament round.
 * Typically 2-4 players per group.
 */
export class Group {
  static readonly MIN_PLAYERS = 1;
  static readonly MAX_PLAYERS = 4;

  constructor(
    public readonly id: string,
    public readonly players: Player[]
  ) {
    if (!id) {
      throw new Error("Group requires an id");
    }

    if (players.length < Group.MIN_PLAYERS || players.length > Group.MAX_PLAYERS) {
      throw new Error(`Group must have ${Group.MIN_PLAYERS}-${Group.MAX_PLAYERS} players`);
    }
  }

  get size(): number {
    return this.players.length;
  }
}
