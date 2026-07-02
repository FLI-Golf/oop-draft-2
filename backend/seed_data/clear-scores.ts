import PocketBase from "pocketbase";
import "dotenv/config";

const PB_URL = process.env.PB_URL || "http://127.0.0.1:8090";
const ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL ?? process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD ?? process.env.POCKETBASE_ADMIN_PASSWORD;
const TOURNAMENT_ID = process.env.TOURNAMENT_ID;
const TOURNAMENT_NAME = process.env.TOURNAMENT_NAME;
const SEASON_YEAR = process.env.SEASON_YEAR;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  throw new Error("Missing admin credentials (PB_ADMIN_EMAIL/PB_ADMIN_PASSWORD).");
}
if (!TOURNAMENT_ID && !TOURNAMENT_NAME && !SEASON_YEAR) {
  throw new Error("Provide TOURNAMENT_ID, TOURNAMENT_NAME, or SEASON_YEAR.");
}

const pb = new PocketBase(PB_URL);

async function getTournamentIds(): Promise<string[]> {
  if (TOURNAMENT_ID) return [TOURNAMENT_ID];

  if (TOURNAMENT_NAME) {
    const tournaments = await pb.collection("tournaments").getFullList<{ id: string }>({
      filter: `name=\"${TOURNAMENT_NAME}\"`,
      sort: "-date",
      perPage: 1
    });
    return tournaments.slice(0, 1).map((t) => t.id);
  }

  const seasons = await pb.collection("seasons").getFullList<{ id: string; year: string }>({
    filter: `year=\"${SEASON_YEAR}\"`,
    perPage: 1
  });
  const season = seasons[0];
  if (!season) return [];

  const tournaments = await pb.collection("tournaments").getFullList<{ id: string }>({
    filter: `seasonId=\"${season.id}\"`,
    sort: "date"
  });
  return tournaments.map((t) => t.id);
}

async function clearTournament(tournamentId: string): Promise<{ scoresDeleted: number; groupsUpdated: number }> {
  const groups = await pb.collection("groups").getFullList<{ id: string }>({
    filter: `tournament=\"${tournamentId}\"`
  });
  if (groups.length === 0) {
    return { scoresDeleted: 0, groupsUpdated: 0 };
  }

  const groupFilter = groups.map((g) => `group=\"${g.id}\"`).join(" || ");
  const scores = groupFilter
    ? await pb.collection("scores").getFullList<{ id: string }>({ filter: groupFilter })
    : [];

  for (const s of scores) {
    await pb.collection("scores").delete(s.id);
  }

  for (const g of groups) {
    await pb.collection("groups").update(g.id, { status: "pending" });
  }

  return { scoresDeleted: scores.length, groupsUpdated: groups.length };
}

async function main() {
  await pb.collection("_superusers").authWithPassword(ADMIN_EMAIL!, ADMIN_PASSWORD!);
  const tournamentIds = await getTournamentIds();

  if (tournamentIds.length === 0) {
    console.log("No tournaments matched.");
    return;
  }

  let totalScores = 0;
  let totalGroups = 0;

  for (const id of tournamentIds) {
    const { scoresDeleted, groupsUpdated } = await clearTournament(id);
    totalScores += scoresDeleted;
    totalGroups += groupsUpdated;
    console.log(`Tournament ${id}: deleted ${scoresDeleted} scores, reset ${groupsUpdated} groups`);
  }

  console.log(`Done. Deleted ${totalScores} scores and reset ${totalGroups} groups.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
