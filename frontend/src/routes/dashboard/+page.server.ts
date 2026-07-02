import type { Actions, PageServerLoad } from "./$types";
import { fail } from "@sveltejs/kit";
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
  baseHoleDistances?: number[];
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

type ScoreRecord = {
  id: string;
  group: string;
  player: string;
  hole: number;
  score: number;
};

type PrizeDistributionRecord = {
  id: string;
  tournament: string;
  team: string;
  position: number;
  prizeAmount: number;
};

type TeamStanding = {
  position: number;
  teamId: string;
  teamName: string;
  totalScore: number;
  prizeAmount: number;
  malePlayerId: string;
  malePlayerName: string;
  femalePlayerId: string;
  femalePlayerName: string;
};

export const load: PageServerLoad = async ({ url }) => {
  const pb = getServerPB();

  const selectedSeason = url.searchParams.get("season") ?? "2027";
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
  let teams: TeamRecord[] = [];
  try {
    teams = await pb.collection("teams").getFullList<TeamRecord>({
      sort: "name",
      expand: "malePlayer,femalePlayer",
    });
  } catch (e) {
    console.warn("[dashboard/load] failed to load teams:", e);
  }

  const teamsMap = new Map<string, TeamRecord>();
  for (const team of teams) teamsMap.set(team.id, team);

  const tournamentId = selectedTournamentId ?? tournaments[0]?.id;

  let groups: GroupRecord[] = [];
  let tournamentSettings: TournamentSettingsRecord | null = null;
  let selectedTournament: TournamentRecord | null =
    tournamentId ? tournaments.find((t) => t.id === tournamentId) ?? null : null;
  let standings: TeamStanding[] = [];
  let samplePayload: Record<string, unknown> | null = null;
  let tournamentResultsPayload: Array<Record<string, unknown>> = [];

  if (tournamentId) {
    try {
      groups = await pb.collection("groups").getFullList<GroupRecord>({
        filter: `tournament="${tournamentId}"`,
        sort: "groupNumber",
      });
    } catch (e) {
      console.warn("[dashboard/load] failed to load groups:", e);
    }

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

    const groupFilter = groups.map((g) => `group="${g.id}"`).join(" || ");
    let scores: ScoreRecord[] = [];
    if (groupFilter) {
      try {
        scores = await pb.collection("scores").getFullList<ScoreRecord>({
          filter: groupFilter
        });
      } catch (e) {
        console.warn("[dashboard/load] failed to load scores:", e);
      }
    }

    if (scores.length > 0) {
      const teamScores = new Map<string, number>();
      for (const group of groups) {
        const groupScores = scores.filter((s) => s.group === group.id);
        const teamIds = [group.team1, group.team2].filter(Boolean);

        for (const teamId of teamIds) {
          const team = teamsMap.get(teamId);
          if (!team) continue;

          const playerIds = [team.malePlayer, team.femalePlayer].filter(Boolean);
          const subtotal = groupScores
            .filter((s) => playerIds.includes(s.player))
            .reduce((sum, s) => sum + s.score, 0);

          teamScores.set(teamId, (teamScores.get(teamId) ?? 0) + subtotal);
        }
      }

      const prizeRows = await pb.collection("prize_distributions").getFullList<PrizeDistributionRecord>({
        filter: `tournament="${tournamentId}"`
      });
      const prizeByPosition = new Map<number, number>();
      for (const p of prizeRows) {
        if (!prizeByPosition.has(p.position)) {
          prizeByPosition.set(p.position, p.prizeAmount);
        }
      }

      standings = Array.from(teamScores.entries())
        .map(([teamId, totalScore]) => ({
          team: teamsMap.get(teamId),
          totalScore
        }))
        .filter((x) => x.team)
        .sort((a, b) => a.totalScore - b.totalScore || a.team!.name.localeCompare(b.team!.name))
        .map((row, idx) => ({
          position: idx + 1,
          teamId: row.team!.id,
          teamName: row.team!.name,
          totalScore: row.totalScore,
          prizeAmount: prizeByPosition.get(idx + 1) ?? 0,
          malePlayerId: row.team!.malePlayer,
          malePlayerName: row.team!.expand?.malePlayer?.name ?? "-",
          femalePlayerId: row.team!.femalePlayer,
          femalePlayerName: row.team!.expand?.femalePlayer?.name ?? "-"
        }));

      samplePayload = {
        schemaVersion: "v1",
        source: "oop-draft-2",
        generatedAt: new Date().toISOString(),
        seasonYear: selectedSeason,
        tournament: {
          id: selectedTournament?.id,
          name: selectedTournament?.name,
          date: selectedTournament?.date?.split(" ")[0] ?? selectedTournament?.date
        },
        summary: {
          groups: groups.length,
          scoreRows: scores.length,
          teamsRanked: standings.length
        },
        results: standings.map((s) => ({
          position: s.position,
          teamId: s.teamId,
          teamName: s.teamName,
          totalScore: s.totalScore,
          prizeAmount: s.prizeAmount,
          players: {
            male: s.malePlayerName,
            female: s.femalePlayerName
          }
        }))
      };

      // Records shaped to match POST /api/collections/tournament_results/records body.
      const toResultRecord = (
        standing: TeamStanding,
        proId: string,
        proName: string,
      ): Record<string, unknown> => {
        return {
          tournament: selectedTournament?.id,
          pro: proId,
          franchise: standing.teamId,
          placement: standing.position,
          score: String(standing.totalScore),
          rounds: 1,
          notes: `Generated sample for ${selectedTournament?.name} (${proName})`,
          franchiseRank: standing.position
        };
      };

      tournamentResultsPayload = standings.flatMap((s) => [
        toResultRecord(s, s.malePlayerId, s.malePlayerName),
        toResultRecord(s, s.femalePlayerId, s.femalePlayerName)
      ]);
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
    standings,
    samplePayload,
    tournamentResultsPayload,
  };
};

function hashString(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function makeTempScore(player: PlayerRecord | undefined, key: string): number {
  const rating = player?.rating ?? 975;
  const skillAdjust = rating >= 1020 ? -0.4 : rating >= 990 ? -0.2 : 0;
  const noise = (hashString(key) % 5) - 2; // -2..2
  const raw = 3.5 + skillAdjust + noise * 0.35;
  return clamp(Math.round(raw), 2, 6);
}

export const actions: Actions = {
  seedTemporaryScores: async ({ request }) => {
    const pb = getServerPB();
    const data = await request.formData();

    const tournamentId = String(data.get("tournamentId") ?? "").trim();
    if (!tournamentId) {
      return fail(400, { error: "Tournament is required." });
    }

    try {
      const tournament = await pb.collection("tournaments").getOne<TournamentRecord>(tournamentId, {
        expand: "course"
      });

      const groups = await pb.collection("groups").getFullList<GroupRecord>({
        filter: `tournament="${tournamentId}"`,
        sort: "groupNumber",
        expand: "team1,team2,team1.malePlayer,team1.femalePlayer,team2.malePlayer,team2.femalePlayer"
      });

      if (groups.length === 0) {
        return fail(400, { error: "No groups exist for this tournament yet." });
      }

      const groupFilter = groups.map((g) => `group="${g.id}"`).join(" || ");
      const existingScores = groupFilter
        ? await pb.collection("scores").getFullList<{ id: string }>({ filter: groupFilter })
        : [];

      for (const score of existingScores) {
        await pb.collection("scores").delete(score.id);
      }

      const holes = Math.max(1, tournament.expand?.course?.baseHoleDistances?.length ?? 9);
      let created = 0;

      for (const group of groups) {
        const players: Array<PlayerRecord | undefined> = [
          group.expand?.team1?.expand?.malePlayer,
          group.expand?.team1?.expand?.femalePlayer,
          group.expand?.team2?.expand?.malePlayer,
          group.expand?.team2?.expand?.femalePlayer
        ];

        for (const player of players) {
          if (!player?.id) continue;
          for (let hole = 1; hole <= holes; hole++) {
            const score = makeTempScore(player, `${group.id}:${player.id}:${hole}`);
            await pb.collection("scores").create({
              group: group.id,
              player: player.id,
              hole,
              score
            });
            created++;
          }
        }

        await pb.collection("groups").update(group.id, { status: "complete" });
      }

      return {
        success: true,
        message: `Seeded ${created} temporary scores for ${tournament.name}.`
      };
    } catch (e: any) {
      return fail(e?.status || 500, {
        error: e?.message || "Failed to seed temporary scores."
      });
    }
  },

  clearTournamentScores: async ({ request }) => {
    const pb = getServerPB();
    const data = await request.formData();

    const tournamentId = String(data.get("tournamentId") ?? "").trim();
    if (!tournamentId) {
      return fail(400, { error: "Tournament is required." });
    }

    try {
      const tournament = await pb.collection("tournaments").getOne<TournamentRecord>(tournamentId);
      const groups = await pb.collection("groups").getFullList<GroupRecord>({
        filter: `tournament="${tournamentId}"`
      });

      if (groups.length === 0) {
        return { success: true, message: `No groups found for ${tournament.name}; nothing to clear.` };
      }

      const groupFilter = groups.map((g) => `group="${g.id}"`).join(" || ");
      const existingScores = groupFilter
        ? await pb.collection("scores").getFullList<{ id: string }>({ filter: groupFilter })
        : [];

      for (const score of existingScores) {
        await pb.collection("scores").delete(score.id);
      }

      for (const group of groups) {
        await pb.collection("groups").update(group.id, { status: "pending" });
      }

      return {
        success: true,
        message: `Cleared ${existingScores.length} scores for ${tournament.name}.`
      };
    } catch (e: any) {
      return fail(e?.status || 500, {
        error: e?.message || "Failed to clear scores."
      });
    }
  }
};
