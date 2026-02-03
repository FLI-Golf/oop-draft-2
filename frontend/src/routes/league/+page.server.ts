import type { PageServerLoad } from "./$types";
import { getServerPB } from "$lib/server/pb";

type PlayerRecord = {
  id: string;
  name: string;
  gender: "male" | "female";
  rating: number;
  world_ranking: number;
  active: boolean;
  is_reserve: boolean;
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

type TournamentRecord = {
  id: string;
  name: string;
  date: string;
  season: string;
};

type SeasonSettingsRecord = {
  id: string;
  season: string;
  prizePool: number;
  distributed: boolean;
};

export const load: PageServerLoad = async () => {
  const pb = getServerPB();

  // Get all teams with expanded player data
  const teams = await pb.collection("teams").getFullList<TeamRecord>({
    sort: "-team_points,-team_earnings,name",
    expand: "malePlayer,femalePlayer"
  });

  // Get all players (including reserves)
  const players = await pb.collection("players").getFullList<PlayerRecord>({
    sort: "-rating,name"
  });

  // Get upcoming tournaments
  const today = new Date().toISOString().split("T")[0];
  const upcomingTournaments = await pb.collection("tournaments").getFullList<TournamentRecord>({
    filter: `date >= "${today}"`,
    sort: "date"
  });

  // Get season settings
  const seasonSettings = await pb.collection("season_settings").getFullList<SeasonSettingsRecord>({
    sort: "-season"
  });

  // Separate rostered players from reserves
  const rosteredPlayers = players.filter(p => !p.is_reserve);
  const reservePlayers = players.filter(p => p.is_reserve);

  return {
    teams,
    rosteredPlayers,
    reservePlayers,
    upcomingTournaments,
    seasonSettings
  };
};
