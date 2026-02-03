import type { Team } from "./Team";

/**
 * Group represents teams who play together during a tournament round.
 * Typically 2-4 teams per group.
 */
export class Group {
  static readonly MIN_TEAMS = 2;  // change if your format allows 1
  static readonly MAX_TEAMS = 4;

  constructor(
    public readonly id: string,
    public readonly teams: Team[]
  ) {
    if (!id) {
      throw new Error("Group requires an id");
    }

    if (teams.length < Group.MIN_TEAMS || teams.length > Group.MAX_TEAMS) {
      throw new Error(`Group must have ${Group.MIN_TEAMS}-${Group.MAX_TEAMS} teams`);
    }
  }

  get size(): number {
    return this.teams.length;
  }
}
