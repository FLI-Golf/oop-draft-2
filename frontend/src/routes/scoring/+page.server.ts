import type { PageServerLoad, Actions } from "./$types";
import { fail } from "@sveltejs/kit";
import { getServerPB } from "$lib/server/pb";

type PlayerRecord = {
  id: string;
  name: string;
  gender: "male" | "female";
};

type TournamentSettingsRecord = {
  id: string;
  tournament: string;
  format: string;
  scoringModel?: string;
  groupSize?: number;
};

type TeamRecord = {
  id: string;
  name: string;
  malePlayer: string;
  femalePlayer: string;
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

type GroupRecord = {
  id: string;
  tournament: string;
  team1: string;
  team2: string;
  groupNumber: number;
  teeTime: string;
  startingHole: number;
  stage: "standard" | "playoff";
  status: "pending" | "in_progress" | "complete" | "";
  expand?: {
    tournament?: TournamentRecord;
    team1?: TeamRecord;
    team2?: TeamRecord;
  };
};

type ScoreRecord = {
  id: string;
  group: string;
  player: string;
  hole: number;
  score: number;
};

export const load: PageServerLoad = async ({ url }) => {
  const pb = getServerPB();
  
  const selectedSeason = url.searchParams.get("season") ?? "2026";
  const selectedTournamentId = url.searchParams.get("tournament");
  const selectedGroupId = url.searchParams.get("group");

  // Get all tournaments for the season
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
        expand: "seasonId"
      });
    }
  } catch (e) {
    console.warn("[scoring/load] failed to load tournaments:", e);
    tournaments = [];
  }

  // Get groups for selected tournament
  const tournamentId = selectedTournamentId ?? tournaments[0]?.id;
  let groups: GroupRecord[] = [];
  
  if (tournamentId) {
    groups = await pb.collection("groups").getFullList<GroupRecord>({
      filter: `tournament="${tournamentId}"`,
      sort: "groupNumber",
      expand: "tournament,team1,team2,team1.malePlayer,team1.femalePlayer,team2.malePlayer,team2.femalePlayer"
    });
  }

  // Get selected group details and scores
  let selectedGroup: GroupRecord | null = null;
  let scores: ScoreRecord[] = [];
  let players: PlayerRecord[] = [];

  if (selectedGroupId) {
    selectedGroup = groups.find(g => g.id === selectedGroupId) ?? null;
    
    if (selectedGroup) {
      // Get all scores for this group
      scores = await pb.collection("scores").getFullList<ScoreRecord>({
        filter: `group="${selectedGroupId}"`,
        sort: "player,hole"
      });

      // Get all 4 players in the group
      const team1 = selectedGroup.expand?.team1;
      const team2 = selectedGroup.expand?.team2;
      
      if (team1?.expand?.malePlayer) players.push(team1.expand.malePlayer);
      if (team1?.expand?.femalePlayer) players.push(team1.expand.femalePlayer);
      if (team2?.expand?.malePlayer) players.push(team2.expand.malePlayer);
      if (team2?.expand?.femalePlayer) players.push(team2.expand.femalePlayer);
    }
  }

  return {
    tournaments,
    groups,
    selectedGroup,
    scores,
    players,
    selectedSeason,
    selectedTournamentId: tournamentId,
    selectedGroupId
  };
};

export const actions: Actions = {
  saveScore: async ({ request }) => {
    const pb = getServerPB();
    const data = await request.formData();
    
    const groupId = String(data.get("groupId") ?? "");
    const playerId = String(data.get("playerId") ?? "");
    const hole = Number(data.get("hole"));
    const score = Number(data.get("score"));

    if (!groupId || !playerId || !hole) {
      return fail(400, { error: "Missing required fields" });
    }

    try {
      // Check if score already exists
      const existing = await pb.collection("scores").getFullList<ScoreRecord>({
        filter: `group="${groupId}" && player="${playerId}" && hole=${hole}`
      });

      if (existing.length > 0) {
        // Update existing score
        await pb.collection("scores").update(existing[0].id, { score });
      } else {
        // Create new score
        await pb.collection("scores").create({
          group: groupId,
          player: playerId,
          hole,
          score
        });
      }

      return { success: true };
    } catch (e: any) {
      return fail(e?.status || 500, { error: e?.message || "Failed to save score" });
    }
  },

  updateGroupStatus: async ({ request }) => {
    const pb = getServerPB();
    const data = await request.formData();
    
    const groupId = String(data.get("groupId") ?? "");
    const status = String(data.get("status") ?? "");

    if (!groupId || !status) {
      return fail(400, { error: "Missing required fields" });
    }

    try {
      await pb.collection("groups").update(groupId, { status });
      return { success: true };
    } catch (e: any) {
      return fail(e?.status || 500, { error: e?.message || "Failed to update status" });
    }
  }
};
