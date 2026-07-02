import PocketBase from "pocketbase";
import "dotenv/config";

type PlayerRecord = {
  id: string;
  rating?: number;
};

type TeamRecord = {
  id: string;
  expand?: {
    malePlayer?: PlayerRecord;
    femalePlayer?: PlayerRecord;
  };
};

type GroupRecord = {
  id: string;
  groupNumber: number;
  tournament: string;
  expand?: {
    team1?: TeamRecord;
    team2?: TeamRecord;
  };
};

type CourseRecord = {
  id: string;
  baseHoleDistances?: number[];
};

type TournamentRecord = {
  id: string;
  name: string;
  expand?: {
    course?: CourseRecord;
  };
};

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
  const noise = (hashString(key) % 5) - 2;
  const raw = 3.5 + skillAdjust + noise * 0.35;
  return clamp(Math.round(raw), 2, 6);
}

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

async function seedTournament(tournamentId: string): Promise<{ tournament: string; created: number }> {
  const tournament = await pb.collection("tournaments").getOne<TournamentRecord>(tournamentId, {
    expand: "course"
  });

  const groups = await pb.collection("groups").getFullList<GroupRecord>({
    filter: `tournament=\"${tournamentId}\"`,
    sort: "groupNumber",
    expand: "team1,team2,team1.malePlayer,team1.femalePlayer,team2.malePlayer,team2.femalePlayer"
  });

  if (groups.length === 0) {
    return { tournament: tournament.name, created: 0 };
  }

  const groupFilter = groups.map((g) => `group=\"${g.id}\"`).join(" || ");
  const existing = groupFilter
    ? await pb.collection("scores").getFullList<{ id: string }>({ filter: groupFilter })
    : [];

  for (const s of existing) {
    await pb.collection("scores").delete(s.id);
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

  return { tournament: tournament.name, created };
}

async function main() {
  await pb.collection("_superusers").authWithPassword(ADMIN_EMAIL!, ADMIN_PASSWORD!);
  const tournamentIds = await getTournamentIds();

  if (tournamentIds.length === 0) {
    console.log("No tournaments matched.");
    return;
  }

  let total = 0;
  for (const id of tournamentIds) {
    const result = await seedTournament(id);
    total += result.created;
    console.log(`Seeded ${result.created} scores for ${result.tournament}`);
  }

  console.log(`Done. Created ${total} temporary scores.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
