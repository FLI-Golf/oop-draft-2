import type { PageServerLoad } from "./$types";
import { getServerPB } from "$lib/server/pb";

type PlayerRecord = {
  id: string;
  name: string;
  gender: "male" | "female";
  rating: number;
  world_ranking: number;
};

type TeamRecord = {
  id: string;
  name: string;
  malePlayer: string;
  femalePlayer: string;
  team_earnings: number;
  team_points: number;
  expand?: {
    malePlayer?: PlayerRecord;
    femalePlayer?: PlayerRecord;
  };
};

type CourseRecord = {
  id: string;
  name: string;
};

type TournamentRecord = {
  id: string;
  name: string;
  date: string;
  course: string;
  season: string;
  expand?: {
    course?: CourseRecord;
  };
};

type TournamentFormat = "cth" | "standard"; // adjust to your real formats
type ScoringModel = "playoff_total_distance" | "standard_match_total_strokes";

type TournamentSettingsRecord = {
  id: string;
  tournament: string;
  startingHole: number;
  intervalMinutes: number;
  firstTeeTime: string;
  format: TournamentFormat;

  // Make these optional if they may not exist in PocketBase yet
  scoringModel?: ScoringModel;
  groupSize?: number;
};

type GroupRecord = {
  id: string;
  tournament: string;
  team1: string;
  team2: string;
  groupNumber: number;
  teeTime: string;
  startingHole: number;
  expand?: {
    team1?: TeamRecord;
    team2?: TeamRecord;
    tournament?: TournamentRecord;
  };
};

export const load: PageServerLoad = async ({ url }) => {
  const pb = getServerPB();

  const selectedSeason = url.searchParams.get("season") ?? "2026";
  const selectedTournamentId = url.searchParams.get("tournament");

  // Find season record by year, then get tournaments for that season
  let tournaments: TournamentRecord[] = [];
  try {
    const seasons = await pb.collection("seasons").getFullList({
      filter: `year="${selectedSeason}"`,
      perPage: 1
    });
    const seasonRecord = seasons[0];
    if (seasonRecord) {
      tournaments = await pb.collection("tournaments").getFullList<TournamentRecord>({
        filter: `seasonId="${seasonRecord.id}"`,
        sort: "date",
        expand: "course,seasonId",
      });
    }
  } catch (e) {
    // keep tournaments empty on error
    console.warn("[dashboard/load] failed to load tournaments:", e);
    tournaments = [];
  }

  // Get all teams
  const teams = await pb.collection("teams").getFullList<TeamRecord>({
    sort: "name",
    expand: "malePlayer,femalePlayer",
  });

  const teamsMap = new Map<string, TeamRecord>();
  for (const team of teams) teamsMap.set(team.id, team);

  const tournamentId = selectedTournamentId ?? tournaments[0]?.id;

  let groups: GroupRecord[] = [];
  let tournamentSettings: TournamentSettingsRecord | null = null;
  let selectedTournament: TournamentRecord | null =
    tournamentId ? tournaments.find((t) => t.id === tournamentId) ?? null : null;

  if (tournamentId) {
    groups = await pb.collection("groups").getFullList<GroupRecord>({
      filter: `tournament="${tournamentId}"`,
      sort: "groupNumber",
    });

    try {
      tournamentSettings = await pb
        .collection("tournament_settings")
        .getFirstListItem<TournamentSettingsRecord>(`tournament="${tournamentId}"`);

      // Apply defaults AFTER fetch
      tournamentSettings.scoringModel ??=
        tournamentSettings.format === "cth"
          ? "playoff_total_distance"
          : "standard_match_total_strokes";

      tournamentSettings.groupSize ??= 2; // if always 2, keep it simple
    } catch {
      // no settings found
      tournamentSettings = null;
    }
  }

  const enrichedGroups = groups.map((group) => ({
    ...group,
    team1Data: teamsMap.get(group.team1) ?? null,
    team2Data: teamsMap.get(group.team2) ?? null,
  }));

  return {
    tournaments,
    teams,
    groups: enrichedGroups,
    tournamentSettings,
    selectedTournament,
    selectedSeason,
    selectedTournamentId: tournamentId,
  };
};
