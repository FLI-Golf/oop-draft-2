import type { PageServerLoad, Actions } from "./$types";
import { fail } from "@sveltejs/kit";
import { getServerPB } from "$lib/server/pb";

export const load: PageServerLoad = async () => {
  const pb = getServerPB();

  try {
    // Get all seasons
    const seasons = await pb.collection("seasons").getFullList({
      sort: "-year"
    });

    // Count tournaments per season
    const tournamentCountsBySeason: Record<string, number> = {};
    for (const season of seasons) {
      const count = await pb.collection("tournaments").getFullList({
        filter: `seasonId="${season.id}"`,
        perPage: 1
      });
      tournamentCountsBySeason[season.year] = count.length;
    }

    // Check which seasons already have groups
    const groupsExistBySeason: Record<string, boolean> = {};
    for (const season of seasons) {
      const tournaments = await pb.collection("tournaments").getFullList({
        filter: `seasonId="${season.id}"`
      });
      if (tournaments.length > 0) {
        const existingGroups = await pb.collection("groups").getList(1, 1, {
          filter: tournaments.map(t => `tournament="${t.id}"`).join(" || ")
        });
        groupsExistBySeason[season.year] = existingGroups.totalItems > 0;
      } else {
        groupsExistBySeason[season.year] = false;
      }
    }

    return { seasons, tournamentCountsBySeason, groupsExistBySeason };
  } catch (error) {
    console.error("[displays/load] error:", error);
    return { seasons: [], tournamentCountsBySeason: {}, groupsExistBySeason: {} };
  }
};

export const actions: Actions = {
  generateGroups: async ({ request }) => {
    const pb = getServerPB();
    const data = await request.formData();
    const season = String(data.get("season") ?? "").trim();

    if (!season) {
      return fail(400, { error: "Season is required." });
    }

    try {
      // Find season record
      const seasons = await pb.collection("seasons").getFullList({
        filter: `year="${season}"`,
        perPage: 1
      });
      
      if (seasons.length === 0) {
        return fail(400, { error: `Season ${season} not found.` });
      }

      const seasonRecord = seasons[0];

      // Get all tournaments for the season
      const tournaments = await pb.collection("tournaments").getFullList({
        filter: `seasonId="${seasonRecord.id}"`,
        sort: "date"
      });

      console.log(`[generateGroups] Found ${tournaments.length} tournaments for season ${season}`);

      if (tournaments.length === 0) {
        return fail(400, { error: `No tournaments found for season ${season}.` });
      }

      if (tournaments.length > 20) {
        return fail(400, { error: `Too many tournaments (${tournaments.length}). Maximum is 20.` });
      }

      // Get all teams
      const teams = await pb.collection("teams").getFullList({
        sort: "name"
      });

      if (teams.length < 2) {
        return fail(400, { error: "Need at least 2 teams to generate groups." });
      }

      // Check for existing groups
      const existingGroups = await pb.collection("groups").getFullList({
        filter: tournaments.map(t => `tournament="${t.id}"`).join(" || ")
      });

      if (existingGroups.length > 0) {
        return fail(400, { error: `Groups already exist for season ${season}. Delete existing groups first.` });
      }

      // Generate round-robin pairings
      const teamIds = teams.map(t => t.id);
      const numTeams = teamIds.length;
      
      const generateRoundPairings = (round: number): [string, string][] => {
        const pairings: [string, string][] = [];
        const rotated = [...teamIds];
        
        for (let r = 0; r < round; r++) {
          const last = rotated.pop()!;
          rotated.splice(1, 0, last);
        }
        
        for (let i = 0; i < numTeams / 2; i++) {
          pairings.push([rotated[i], rotated[numTeams - 1 - i]]);
        }
        
        return pairings;
      };

      // Get season settings
      const seasonSettingsList = await pb.collection("season_settings").getFullList({
        filter: `season="${season}"`
      });
      const seasonSettings = seasonSettingsList[0];

      if (!seasonSettings) {
        return fail(400, { error: `No prize pool set for season ${season}. Set prize pool first.` });
      }

      // Get tournament settings for all tournaments
      const allTournamentSettings = await pb.collection("tournament_settings").getFullList({
        filter: tournaments.map(id => `tournament="${id.id}"`).join(" || ")
      });
      
      const settingsMap = new Map();
      for (const ts of allTournamentSettings) {
        settingsMap.set(ts.tournament, ts);
      }

      // Helper to calculate tee time
      const calculateTeeTime = (firstTeeTime: string, intervalMinutes: number, groupIndex: number): string => {
        const [hours, minutes] = firstTeeTime.split(":").map(Number);
        const totalMinutes = hours * 60 + minutes + (groupIndex * intervalMinutes);
        const newHours = Math.floor(totalMinutes / 60) % 24;
        const newMinutes = totalMinutes % 60;
        return `${String(newHours).padStart(2, "0")}:${String(newMinutes).padStart(2, "0")}`;
      };

      // Create groups for each tournament
      let groupsCreated = 0;
      for (let i = 0; i < tournaments.length; i++) {
        const tournament = tournaments[i];
        const pairings = generateRoundPairings(i);
        
        const settings = settingsMap.get(tournament.id);
        const firstTeeTime = settings?.firstTeeTime ?? "08:00";
        const intervalMinutes = settings?.intervalMinutes ?? 10;
        const startingHole = settings?.startingHole ?? 1;
        
        for (let g = 0; g < pairings.length; g++) {
          const [team1, team2] = pairings[g];
          const teeTime = calculateTeeTime(firstTeeTime, intervalMinutes, g);
          
          await pb.collection("groups").create({
            tournament: tournament.id,
            team1,
            team2,
            groupNumber: g + 1,
            teeTime,
            startingHole,
            stage: "standard",
            status: "pending"
          });
          groupsCreated++;
        }

        // Create prize distributions
        const prizePerTournament = seasonSettings.prizePool / tournaments.length;
        const payoutPercentages = [
          0.20, 0.15, 0.12, 0.10, 0.09, 0.08, 0.07, 0.06, 0.05, 0.04, 0.025, 0.015
        ];

        for (let pos = 0; pos < teamIds.length; pos++) {
          const prizeAmount = Math.round(prizePerTournament * payoutPercentages[pos]);
          await pb.collection("prize_distributions").create({
            tournament: tournament.id,
            team: teamIds[pos],
            position: pos + 1,
            prizeAmount,
            season
          });
        }
      }

      // Mark season settings as distributed
      await pb.collection("season_settings").update(seasonSettings.id, {
        distributed: true
      });

      return { 
        success: true, 
        message: `Generated ${groupsCreated} groups for ${tournaments.length} tournaments in season ${season}.`
      };
    } catch (e: any) {
      console.error("[displays/generateGroups] error:", e);
      return fail(e?.status || 500, {
        error: e?.message || "Failed to generate groups."
      });
    }
  }
};
