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

type TournamentSettingsRecord = {
  id: string;
  tournament: string;
  startingHole: number;
  intervalMinutes: number;
  firstTeeTime: string;
  format: string;
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

  // Get all tournaments for the season
  const tournaments = await pb.collection("tournaments").getFullList<TournamentRecord>({
    filter: `season="${selectedSeason}"`,
    sort: "date",
    expand: "course"
  });

  // Get all teams
  const teams = await pb.collection("teams").getFullList<TeamRecord>({
    sort: "name",
    expand: "malePlayer,femalePlayer"
  });

  // Create teams map for lookup
  const teamsMap = new Map<string, TeamRecord>();
  for (const team of teams) {
    teamsMap.set(team.id, team);
  }

  // Get groups for selected tournament or first tournament
  const tournamentId = selectedTournamentId ?? tournaments[0]?.id;
  let groups: GroupRecord[] = [];
  let tournamentSettings: TournamentSettingsRecord | null = null;
  let selectedTournament: TournamentRecord | null = null;

  if (tournamentId) {
    selectedTournament = tournaments.find(t => t.id === tournamentId) ?? null;
    
    groups = await pb.collection("groups").getFullList<GroupRecord>({
      filter: `tournament="${tournamentId}"`,
      sort: "groupNumber"
    });

    // Get tournament settings
    try {
      tournamentSettings = await pb.collection("tournament_settings")
        .getFirstListItem<TournamentSettingsRecord>(`tournament="${tournamentId}"`);
    } catch {
      // No settings found
    }
  }

  // Enrich groups with team data
  const enrichedGroups = groups.map(group => ({
    ...group,
    team1Data: teamsMap.get(group.team1),
    team2Data: teamsMap.get(group.team2)
  }));

  return {
    tournaments,
    teams,
    groups: enrichedGroups,
    tournamentSettings,
    selectedTournament,
    selectedSeason,
    selectedTournamentId: tournamentId
  };
};
