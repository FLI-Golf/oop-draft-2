import type { PageServerLoad, Actions } from "./$types";
import { fail } from "@sveltejs/kit";
import { getServerPB } from "$lib/server/pb";

type PlayerRecord = {
  id: string;
  name: string;
  gender: "male" | "female";
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

type PlayoffRecord = {
  id: string;
  tournament: string;
  playoffRound: number;
  forPosition: number;
  status: "pending" | "in_progress" | "complete" | "";
  winner: string;
  expand?: {
    tournament?: TournamentRecord;
    winner?: TeamRecord;
  };
};

type PlayoffTeamRecord = {
  id: string;
  playoff: string;
  team: string;
  tiedScore: number;
  expand?: {
    team?: TeamRecord;
  };
};

type PlayoffThrowRecord = {
  id: string;
  playoff: string;
  team: string;
  player: string;
  distanceFeet: number;
  throwOrder: number;
  expand?: {
    player?: PlayerRecord;
    team?: TeamRecord;
  };
};

type ScoreRecord = {
  id: string;
  group: string;
  player: string;
  hole: number;
  score: number;
};

type GroupRecord = {
  id: string;
  tournament: string;
  team1: string;
  team2: string;
  status: string;
};

export const load: PageServerLoad = async ({ url }) => {
  const pb = getServerPB();
  
  const selectedSeason = url.searchParams.get("season") ?? "2026";
  const selectedTournamentId = url.searchParams.get("tournament");
  const selectedPlayoffId = url.searchParams.get("playoff");

  // Get all tournaments for the season
  const tournaments = await pb.collection("tournaments").getFullList<TournamentRecord>({
    filter: `season="${selectedSeason}"`,
    sort: "date"
  });

  const tournamentId = selectedTournamentId ?? tournaments[0]?.id;
  
  let playoffs: PlayoffRecord[] = [];
  let playoffTeams: PlayoffTeamRecord[] = [];
  let playoffThrows: PlayoffThrowRecord[] = [];
  let selectedPlayoff: PlayoffRecord | null = null;
  let teamStandings: { team: TeamRecord; totalScore: number }[] = [];

  if (tournamentId) {
    // Get existing playoffs for this tournament
    playoffs = await pb.collection("playoffs").getFullList<PlayoffRecord>({
      filter: `tournament="${tournamentId}"`,
      sort: "forPosition,playoffRound",
      expand: "tournament,winner"
    });

    // Calculate team standings from scores
    const groups = await pb.collection("groups").getFullList<GroupRecord>({
      filter: `tournament="${tournamentId}"`
    });

    const teams = await pb.collection("teams").getFullList<TeamRecord>({
      expand: "malePlayer,femalePlayer"
    });

    const teamsMap = new Map<string, TeamRecord>();
    for (const team of teams) {
      teamsMap.set(team.id, team);
    }

    // Get all scores for this tournament's groups
    const groupIds = groups.map(g => g.id);
    let allScores: ScoreRecord[] = [];
    if (groupIds.length > 0) {
      allScores = await pb.collection("scores").getFullList<ScoreRecord>({
        filter: groupIds.map(id => `group="${id}"`).join(" || ")
      });
    }

    // Calculate team totals
    const teamScores = new Map<string, number>();
    
    for (const group of groups) {
      const groupScores = allScores.filter(s => s.group === group.id);
      
      // Get players for each team
      const team1 = teamsMap.get(group.team1);
      const team2 = teamsMap.get(group.team2);
      
      if (team1) {
        const team1PlayerIds = [team1.malePlayer, team1.femalePlayer].filter(Boolean);
        const team1Total = groupScores
          .filter(s => team1PlayerIds.includes(s.player))
          .reduce((sum, s) => sum + s.score, 0);
        teamScores.set(team1.id, (teamScores.get(team1.id) ?? 0) + team1Total);
      }
      
      if (team2) {
        const team2PlayerIds = [team2.malePlayer, team2.femalePlayer].filter(Boolean);
        const team2Total = groupScores
          .filter(s => team2PlayerIds.includes(s.player))
          .reduce((sum, s) => sum + s.score, 0);
        teamScores.set(team2.id, (teamScores.get(team2.id) ?? 0) + team2Total);
      }
    }

    // Sort teams by score
    teamStandings = Array.from(teamScores.entries())
      .map(([teamId, totalScore]) => ({
        team: teamsMap.get(teamId)!,
        totalScore
      }))
      .filter(t => t.team)
      .sort((a, b) => a.totalScore - b.totalScore);

    // Get playoff details if selected
    if (selectedPlayoffId) {
      selectedPlayoff = playoffs.find(p => p.id === selectedPlayoffId) ?? null;
      
      if (selectedPlayoff) {
        playoffTeams = await pb.collection("playoff_teams").getFullList<PlayoffTeamRecord>({
          filter: `playoff="${selectedPlayoffId}"`,
          expand: "team,team.malePlayer,team.femalePlayer"
        });

        playoffThrows = await pb.collection("playoff_throws").getFullList<PlayoffThrowRecord>({
          filter: `playoff="${selectedPlayoffId}"`,
          sort: "team,throwOrder",
          expand: "player,team"
        });
      }
    }
  }

  return {
    tournaments,
    playoffs,
    playoffTeams,
    playoffThrows,
    selectedPlayoff,
    teamStandings,
    selectedSeason,
    selectedTournamentId: tournamentId,
    selectedPlayoffId
  };
};

export const actions: Actions = {
  createPlayoff: async ({ request }) => {
    const pb = getServerPB();
    const data = await request.formData();
    
    const tournamentId = String(data.get("tournamentId") ?? "");
    const forPosition = Number(data.get("forPosition"));
    const tiedTeamIds = String(data.get("tiedTeamIds") ?? "").split(",").filter(Boolean);
    const tiedScore = Number(data.get("tiedScore"));

    if (!tournamentId || !forPosition || tiedTeamIds.length < 2) {
      return fail(400, { error: "Missing required fields" });
    }

    try {
      // Create the playoff
      const playoff = await pb.collection("playoffs").create({
        tournament: tournamentId,
        playoffRound: 1,
        forPosition,
        status: "pending"
      });

      // Add tied teams to the playoff
      for (const teamId of tiedTeamIds) {
        await pb.collection("playoff_teams").create({
          playoff: playoff.id,
          team: teamId,
          tiedScore
        });
      }

      return { success: true, playoffId: playoff.id };
    } catch (e: any) {
      return fail(e?.status || 500, { error: e?.message || "Failed to create playoff" });
    }
  },

  saveThrow: async ({ request }) => {
    const pb = getServerPB();
    const data = await request.formData();
    
    const playoffId = String(data.get("playoffId") ?? "");
    const teamId = String(data.get("teamId") ?? "");
    const playerId = String(data.get("playerId") ?? "");
    const distanceFeet = Number(data.get("distanceFeet"));
    const throwOrder = Number(data.get("throwOrder"));

    if (!playoffId || !teamId || !playerId || distanceFeet < 0) {
      return fail(400, { error: "Missing required fields" });
    }

    try {
      // Check if throw already exists
      const existing = await pb.collection("playoff_throws").getFullList({
        filter: `playoff="${playoffId}" && team="${teamId}" && player="${playerId}"`
      });

      if (existing.length > 0) {
        await pb.collection("playoff_throws").update(existing[0].id, { distanceFeet });
      } else {
        await pb.collection("playoff_throws").create({
          playoff: playoffId,
          team: teamId,
          player: playerId,
          distanceFeet,
          throwOrder
        });
      }

      // Update playoff status to in_progress
      await pb.collection("playoffs").update(playoffId, { status: "in_progress" });

      return { success: true };
    } catch (e: any) {
      return fail(e?.status || 500, { error: e?.message || "Failed to save throw" });
    }
  },

  completePlayoff: async ({ request }) => {
    const pb = getServerPB();
    const data = await request.formData();
    
    const playoffId = String(data.get("playoffId") ?? "");

    if (!playoffId) {
      return fail(400, { error: "Missing playoff ID" });
    }

    try {
      // Get all throws for this playoff
      const throws = await pb.collection("playoff_throws").getFullList<PlayoffThrowRecord>({
        filter: `playoff="${playoffId}"`
      });

      // Calculate total distance per team
      const teamDistances = new Map<string, number>();
      for (const t of throws) {
        teamDistances.set(t.team, (teamDistances.get(t.team) ?? 0) + t.distanceFeet);
      }

      // Find winner (lowest total distance)
      let winnerId = "";
      let lowestDistance = Infinity;
      for (const [teamId, distance] of teamDistances) {
        if (distance < lowestDistance) {
          lowestDistance = distance;
          winnerId = teamId;
        }
      }

      // Update playoff with winner
      await pb.collection("playoffs").update(playoffId, {
        status: "complete",
        winner: winnerId
      });

      return { success: true, winnerId };
    } catch (e: any) {
      return fail(e?.status || 500, { error: e?.message || "Failed to complete playoff" });
    }
  }
};
