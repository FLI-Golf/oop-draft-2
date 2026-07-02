import fs from "node:fs";
import PocketBase from "pocketbase";
import "dotenv/config";

type PlayerRecord = {
  id: string;
  name: string;
};

type TeamRecord = {
  id: string;
  name: string;
  malePlayer?: string;
  femalePlayer?: string;
  expand?: {
    malePlayer?: PlayerRecord;
    femalePlayer?: PlayerRecord;
  };
};

type GroupRecord = {
  id: string;
  tournament: string;
  team1: string;
  team2: string;
};

type ScoreRecord = {
  id: string;
  group: string;
  player: string;
  hole: number;
  score: number;
};

type TournamentRecord = {
  id: string;
  name: string;
  date: string;
  seasonId?: string;
};

type SeasonRecord = {
  id: string;
  year: string;
};

type PrizeDistributionRecord = {
  id: string;
  tournament: string;
  team: string;
  position: number;
  prizeAmount: number;
};

type TeamResultPayload = {
  position: number;
  teamId: string;
  teamName: string;
  totalScore: number;
  prizeAmount: number;
  players: {
    male?: string;
    female?: string;
  };
};

type TournamentResultsPayload = {
  schemaVersion: string;
  source: "oop-draft-2";
  generatedAt: string;
  seasonYear: string;
  tournament: {
    id: string;
    externalId?: string;
    name: string;
    date: string;
  };
  summary: {
    groups: number;
    scoreRows: number;
    teamsRanked: number;
  };
  results: TeamResultPayload[];
};

type NameMap = Record<string, string>;

type ExternalMap = {
  tournaments?: Record<string, string>;
  teams?: Record<string, string>;
};

const PB_URL = process.env.PB_URL || "http://127.0.0.1:8090";
const ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL ?? process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD ?? process.env.POCKETBASE_ADMIN_PASSWORD;
const TOURNAMENT_ID = process.env.TOURNAMENT_ID;
const TOURNAMENT_NAME = process.env.TOURNAMENT_NAME;
const SEASON_YEAR = process.env.SEASON_YEAR;
const OUTPUT_FILE = process.env.OUTPUT_FILE || "./backend/seed_data/last-tournament-results.json";
const TEAM_NAME_MAP_FILE = process.env.TEAM_NAME_MAP_FILE;
const EXTERNAL_ID_MAP_FILE = process.env.EXTERNAL_ID_MAP_FILE;
const ALLOW_EMPTY_SCORES = process.env.ALLOW_EMPTY_SCORES === "1";

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  throw new Error("Missing admin credentials (PB_ADMIN_EMAIL/PB_ADMIN_PASSWORD).");
}
if (!TOURNAMENT_ID && !TOURNAMENT_NAME) {
  throw new Error("Provide TOURNAMENT_ID or TOURNAMENT_NAME.");
}

function readJsonFile<T>(path?: string): T | null {
  if (!path) return null;
  if (!fs.existsSync(path)) return null;
  return JSON.parse(fs.readFileSync(path, "utf-8")) as T;
}

function mustDateOnly(isoDate: string): string {
  return isoDate.includes(" ") ? isoDate.split(" ")[0] : isoDate.split("T")[0];
}

async function resolveTournament(pb: PocketBase): Promise<TournamentRecord> {
  if (TOURNAMENT_ID) {
    return pb.collection("tournaments").getOne<TournamentRecord>(TOURNAMENT_ID);
  }

  const rows = await pb.collection("tournaments").getFullList<TournamentRecord>({
    filter: `name=\"${TOURNAMENT_NAME}\"`,
    sort: "-date",
    perPage: 5
  });

  if (rows.length === 0) {
    throw new Error(`Tournament not found by name: ${TOURNAMENT_NAME}`);
  }

  if (SEASON_YEAR) {
    const seasons = await pb.collection("seasons").getFullList<SeasonRecord>({
      filter: `year=\"${SEASON_YEAR}\"`,
      perPage: 1
    });
    const seasonId = seasons[0]?.id;
    if (seasonId) {
      const bySeason = rows.find((r) => r.seasonId === seasonId);
      if (bySeason) return bySeason;
    }
  }

  return rows[0];
}

function rankTeams(
  groups: GroupRecord[],
  scores: ScoreRecord[],
  teamsMap: Map<string, TeamRecord>
): Array<{ team: TeamRecord; totalScore: number }> {
  const teamScores = new Map<string, number>();

  for (const group of groups) {
    const groupScores = scores.filter((s) => s.group === group.id);
    const teamIds = [group.team1, group.team2].filter(Boolean);

    for (const teamId of teamIds) {
      const team = teamsMap.get(teamId);
      if (!team) continue;

      const playerIds = [team.malePlayer, team.femalePlayer].filter(Boolean) as string[];
      const subtotal = groupScores
        .filter((s) => playerIds.includes(s.player))
        .reduce((sum, s) => sum + s.score, 0);

      teamScores.set(teamId, (teamScores.get(teamId) ?? 0) + subtotal);
    }
  }

  return Array.from(teamScores.entries())
    .map(([teamId, totalScore]) => ({ team: teamsMap.get(teamId)!, totalScore }))
    .filter((x) => Boolean(x.team))
    .sort((a, b) => a.totalScore - b.totalScore || a.team.name.localeCompare(b.team.name));
}

async function main() {
  const pb = new PocketBase(PB_URL);
  await pb.collection("_superusers").authWithPassword(ADMIN_EMAIL!, ADMIN_PASSWORD!);

  const teamNameMap = readJsonFile<NameMap>(TEAM_NAME_MAP_FILE) ?? {};
  const externalMap = readJsonFile<ExternalMap>(EXTERNAL_ID_MAP_FILE) ?? {};

  const tournament = await resolveTournament(pb);

  const season = tournament.seasonId
    ? await pb.collection("seasons").getOne<SeasonRecord>(tournament.seasonId)
    : null;

  const groups = await pb.collection("groups").getFullList<GroupRecord>({
    filter: `tournament=\"${tournament.id}\"`
  });

  const teams = await pb.collection("teams").getFullList<TeamRecord>({
    expand: "malePlayer,femalePlayer"
  });
  const teamsMap = new Map(teams.map((t) => [t.id, t]));

  const groupFilter = groups.map((g) => `group=\"${g.id}\"`).join(" || ");
  const scores = groupFilter
    ? await pb.collection("scores").getFullList<ScoreRecord>({ filter: groupFilter })
    : [];

  if (!ALLOW_EMPTY_SCORES && scores.length === 0) {
    throw new Error("No scores found for tournament. Seed scores or set ALLOW_EMPTY_SCORES=1.");
  }

  const ranked = rankTeams(groups, scores, teamsMap);

  const prizeRows = await pb.collection("prize_distributions").getFullList<PrizeDistributionRecord>({
    filter: `tournament=\"${tournament.id}\"`
  });
  const prizeByPosition = new Map<number, number>();
  for (const p of prizeRows) {
    if (!prizeByPosition.has(p.position)) {
      prizeByPosition.set(p.position, p.prizeAmount);
    }
  }

  const results: TeamResultPayload[] = ranked.map((row, idx) => {
    const position = idx + 1;
    const mappedName = teamNameMap[row.team.name] ?? row.team.name;
    return {
      position,
      teamId: externalMap.teams?.[row.team.id] ?? row.team.id,
      teamName: mappedName,
      totalScore: row.totalScore,
      prizeAmount: prizeByPosition.get(position) ?? 0,
      players: {
        male: row.team.expand?.malePlayer?.name,
        female: row.team.expand?.femalePlayer?.name
      }
    };
  });

  const payload: TournamentResultsPayload = {
    schemaVersion: "v1",
    source: "oop-draft-2",
    generatedAt: new Date().toISOString(),
    seasonYear: season?.year ?? "unknown",
    tournament: {
      id: tournament.id,
      externalId: externalMap.tournaments?.[tournament.id],
      name: tournament.name,
      date: mustDateOnly(tournament.date)
    },
    summary: {
      groups: groups.length,
      scoreRows: scores.length,
      teamsRanked: results.length
    },
    results
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(payload, null, 2));

  console.log(`Tournament: ${payload.tournament.name} (${payload.tournament.id})`);
  console.log(`Season: ${payload.seasonYear}`);
  console.log(`Ranked teams: ${payload.summary.teamsRanked}`);
  console.log(`Score rows: ${payload.summary.scoreRows}`);
  console.log(`Wrote payload: ${OUTPUT_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
