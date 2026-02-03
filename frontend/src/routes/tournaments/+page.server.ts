import type { PageServerLoad, Actions } from "./$types";
import { fail } from "@sveltejs/kit";
import { getServerPB } from "$lib/server/pb";

type CourseRecord = {
  id: string;
  name: string;
  baseHoleDistances: number[];
};

type TournamentRecord = {
  id: string;
  name: string;
  date: string;
  course: string;
  season?: "2026" | "2027" | "2028" | "2029";
  expand?: {
    course?: CourseRecord;
  };
};

type TeamRecord = {
  id: string;
  name: string;
};

type GroupRecord = {
  id: string;
  tournament: string;
  team1: string;
  team2: string;
};

type SeasonSettingsRecord = {
  id: string;
  season: string;
  prizePool: number;
  distributed: boolean;
};

export const load: PageServerLoad = async () => {
  const pb = getServerPB();

  const courses = await pb.collection("courses").getFullList<CourseRecord>({
    sort: "name"
  });

  const tournaments = await pb.collection("tournaments").getFullList<TournamentRecord>({
    sort: "-date",
    expand: "course"
  });

  // Count tournaments per season for the generate groups button
  const tournamentCountsBySeason: Record<string, number> = {};
  for (const t of tournaments) {
    if (t.season) {
      tournamentCountsBySeason[t.season] = (tournamentCountsBySeason[t.season] || 0) + 1;
    }
  }

  // Get season settings for prize pools
  const seasonSettings = await pb.collection("season_settings").getFullList<SeasonSettingsRecord>({
    sort: "season"
  });
  const seasonSettingsMap: Record<string, SeasonSettingsRecord> = {};
  for (const s of seasonSettings) {
    seasonSettingsMap[s.season] = s;
  }

  return { courses, tournaments, tournamentCountsBySeason, seasonSettingsMap };
};

export const actions: Actions = {
  createCourse: async ({ request }) => {
    const pb = getServerPB();
    const data = await request.formData();

    const name = String(data.get("courseName") ?? "").trim();
    const distancesRaw = String(data.get("baseHoleDistances") ?? "").trim();

    if (!name || !distancesRaw) {
      return fail(400, { courseError: "Missing required fields." });
    }

    // Parse comma or space separated distances
    const distances = distancesRaw
      .split(/[\s,]+/)
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !isNaN(n));

    if (distances.length !== 9 || !distances.every((n) => isFinite(n))) {
      return fail(400, { courseError: "Distances must be exactly 9 valid numbers." });
    }

    try {
      const created = await pb.collection("courses").create<CourseRecord>({
        name,
        baseHoleDistances: distances
      });

      return { courseSuccess: true, createdCourseId: created.id };
    } catch (e: any) {
      return fail(e?.status || 500, {
        courseError: e?.message || "Create course failed."
      });
    }
  },

  createTournament: async ({ request }) => {
    const pb = getServerPB();
    const data = await request.formData();

    const name = String(data.get("name") ?? "").trim();
    const date = String(data.get("date") ?? "").trim();
    const course = String(data.get("course") ?? "").trim();
    const season = String(data.get("season") ?? "").trim();

    const allowedSeasons = new Set(["2026", "2027", "2028", "2029"]);

    if (!name || !date || !course || !season) {
      return fail(400, { error: "Missing required fields." });
    }

    if (!allowedSeasons.has(season)) {
      return fail(400, { error: "Invalid season." });
    }

    try {
      const created = await pb.collection("tournaments").create<TournamentRecord>({
        name,
        date,
        course,
        season
      });

      return { success: true, createdId: created.id };
    } catch (e: any) {
      return fail(e?.status || 500, {
        error: e?.message || "Create failed (rules/auth)."
      });
    }
  },

  setSeasonPrizePool: async ({ request }) => {
    const pb = getServerPB();
    const data = await request.formData();
    const season = String(data.get("season") ?? "").trim();
    const prizePool = parseInt(String(data.get("prizePool") ?? "0"), 10);

    if (!season) {
      return fail(400, { error: "Season is required." });
    }

    if (prizePool < 2000000 || prizePool > 6000000) {
      return fail(400, { error: "Prize pool must be between $2M and $6M." });
    }

    try {
      // Check if season settings already exist
      const existing = await pb.collection("season_settings").getFullList<SeasonSettingsRecord>({
        filter: `season="${season}"`
      });

      if (existing.length > 0) {
        // Update existing
        await pb.collection("season_settings").update(existing[0].id, {
          prizePool,
          distributed: false
        });
      } else {
        // Create new
        await pb.collection("season_settings").create({
          season,
          prizePool,
          distributed: false
        });
      }

      return { success: true, message: `Prize pool set to $${(prizePool / 1000000).toFixed(0)}M for ${season}.` };
    } catch (e: any) {
      return fail(e?.status || 500, {
        error: e?.message || "Failed to set prize pool."
      });
    }
  },

  generateGroups: async ({ request }) => {
    const pb = getServerPB();
    const data = await request.formData();
    const season = String(data.get("season") ?? "").trim();

    if (!season) {
      return fail(400, { error: "Season is required." });
    }

    try {
      // Get all tournaments for the season, sorted by date
      const tournaments = await pb.collection("tournaments").getFullList<TournamentRecord>({
        filter: `season="${season}"`,
        sort: "date"
      });

      if (tournaments.length === 0) {
        return fail(400, { error: `No tournaments found for season ${season}.` });
      }

      if (tournaments.length > 20) {
        return fail(400, { error: `Too many tournaments (${tournaments.length}). Maximum is 20.` });
      }

      // Get all teams
      const teams = await pb.collection("teams").getFullList<TeamRecord>({
        sort: "name"
      });

      if (teams.length < 2) {
        return fail(400, { error: "Need at least 2 teams to generate groups." });
      }

      // Check for existing groups in any tournament this season
      const existingGroups = await pb.collection("groups").getFullList<GroupRecord>({
        filter: tournaments.map(t => `tournament="${t.id}"`).join(" || ")
      });

      if (existingGroups.length > 0) {
        return fail(400, { error: `Groups already exist for season ${season}. Delete existing groups first.` });
      }

      // Generate diverse matchups using round-robin algorithm
      // Each team should play with different opponents across tournaments
      const teamIds = teams.map(t => t.id);
      const numTeams = teamIds.length;
      
      // For round-robin pairing: rotate all but first team
      // This ensures maximum diversity across rounds
      const generateRoundPairings = (round: number): [string, string][] => {
        const pairings: [string, string][] = [];
        const rotated = [...teamIds];
        
        // Rotate teams (keep first fixed, rotate rest) based on round
        for (let r = 0; r < round; r++) {
          const last = rotated.pop()!;
          rotated.splice(1, 0, last);
        }
        
        // Pair first with last, second with second-to-last, etc.
        for (let i = 0; i < numTeams / 2; i++) {
          pairings.push([rotated[i], rotated[numTeams - 1 - i]]);
        }
        
        return pairings;
      };

      // Check if prize pool is set for this season
      const seasonSettingsList = await pb.collection("season_settings").getFullList<SeasonSettingsRecord>({
        filter: `season="${season}"`
      });
      const seasonSettings = seasonSettingsList[0];

      if (!seasonSettings) {
        return fail(400, { error: `No prize pool set for season ${season}. Set prize pool first.` });
      }

      // Calculate prize distribution per tournament
      // Prize pool split: distribute across all tournaments
      const prizePerTournament = seasonSettings.prizePool / tournaments.length;
      
      // Position-based payout percentages (12 teams)
      // Ensures all teams get something, top teams get more
      const payoutPercentages = [
        0.20,  // 1st: 20%
        0.15,  // 2nd: 15%
        0.12,  // 3rd: 12%
        0.10,  // 4th: 10%
        0.09,  // 5th: 9%
        0.08,  // 6th: 8%
        0.07,  // 7th: 7%
        0.06,  // 8th: 6%
        0.05,  // 9th: 5%
        0.04,  // 10th: 4%
        0.025, // 11th: 2.5%
        0.015  // 12th: 1.5%
      ];

      // Create groups for each tournament
      for (let i = 0; i < tournaments.length; i++) {
        const tournament = tournaments[i];
        const pairings = generateRoundPairings(i);
        
        for (let g = 0; g < pairings.length; g++) {
          const [team1, team2] = pairings[g];
          await pb.collection("groups").create({
            tournament: tournament.id,
            team1,
            team2,
            groupNumber: g + 1
          });
        }

        // Create prize distribution records for this tournament
        // Position will be determined after tournament, but we pre-allocate the structure
        // For now, assign positions based on team order (will be updated after results)
        for (let pos = 0; pos < teamIds.length; pos++) {
          const prizeAmount = Math.round(prizePerTournament * payoutPercentages[pos]);
          await pb.collection("prize_distributions").create({
            tournament: tournament.id,
            team: teamIds[pos], // Placeholder - actual position determined by results
            position: pos + 1,
            prizeAmount,
            season
          });
        }
      }

      // Mark season as having distributions created
      await pb.collection("season_settings").update(seasonSettings.id, {
        distributed: true
      });

      return { 
        success: true, 
        message: `Generated groups and prize distributions for ${tournaments.length} tournaments in season ${season}. Total prize pool: $${(seasonSettings.prizePool / 1000000).toFixed(0)}M` 
      };
    } catch (e: any) {
      return fail(e?.status || 500, {
        error: e?.message || "Failed to generate groups."
      });
    }
  }
};

