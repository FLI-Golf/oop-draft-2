import type { Team } from "./Team";

export type GroupStage = "standard" | "playoff";

export class Group {
  static readonly STANDARD_TEAM_COUNT = 2;
  static readonly MIN_PLAYOFF_TEAMS = 2;
  static readonly MAX_PLAYOFF_TEAMS = 4; // adjust if needed

  constructor(
    public readonly id: string,
    public readonly tournamentId: string,
    public readonly stage: GroupStage,
    public readonly teams: Team[],
    public readonly round?: number // optional: normal rounds or playoff rounds
  ) {
    if (!id) throw new Error("Group requires an id");
    if (!tournamentId) throw new Error("Group requires a tournamentId");

    if (stage === "standard") {
      if (teams.length !== Group.STANDARD_TEAM_COUNT) {
        throw new Error(`Standard group must have exactly ${Group.STANDARD_TEAM_COUNT} teams`);
      }
    } else {
      if (
        teams.length < Group.MIN_PLAYOFF_TEAMS ||
        teams.length > Group.MAX_PLAYOFF_TEAMS
      ) {
        throw new Error(
          `Playoff group must have ${Group.MIN_PLAYOFF_TEAMS}-${Group.MAX_PLAYOFF_TEAMS} teams`
        );
      }
    }
  }

  get size(): number {
    return this.teams.length;
  }
}
