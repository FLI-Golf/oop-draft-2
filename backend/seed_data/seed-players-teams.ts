import PocketBase from "pocketbase";

const PB_URL = process.env.PB_URL || "http://127.0.0.1:8090";
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL;
const PB_ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD;

if (!PB_ADMIN_EMAIL || !PB_ADMIN_PASSWORD) {
  console.error(
    "Missing PB_ADMIN_EMAIL or PB_ADMIN_PASSWORD env vars.\n" +
      "Example:\n" +
      "PB_ADMIN_EMAIL=admin@example.com PB_ADMIN_PASSWORD=pass pnpm tsx seed_data/seed-players-teams.ts"
  );
  process.exit(1);
}

const pb = new PocketBase(PB_URL);

// 12 male players
const malePlayers = [
  { name: "Jake Thompson", gender: "male" },
  { name: "Marcus Chen", gender: "male" },
  { name: "Tyler Rodriguez", gender: "male" },
  { name: "Brandon Williams", gender: "male" },
  { name: "Derek Johnson", gender: "male" },
  { name: "Kyle Martinez", gender: "male" },
  { name: "Ryan Davis", gender: "male" },
  { name: "Chris Anderson", gender: "male" },
  { name: "Matt Wilson", gender: "male" },
  { name: "Josh Taylor", gender: "male" },
  { name: "Nick Brown", gender: "male" },
  { name: "Sean Miller", gender: "male" },
];

// 12 female players
const femalePlayers = [
  { name: "Sarah Mitchell", gender: "female" },
  { name: "Emily Garcia", gender: "female" },
  { name: "Jessica Lee", gender: "female" },
  { name: "Amanda Clark", gender: "female" },
  { name: "Rachel Moore", gender: "female" },
  { name: "Lauren White", gender: "female" },
  { name: "Megan Harris", gender: "female" },
  { name: "Ashley Martin", gender: "female" },
  { name: "Brittany Jackson", gender: "female" },
  { name: "Stephanie Thomas", gender: "female" },
  { name: "Nicole Robinson", gender: "female" },
  { name: "Kayla Lewis", gender: "female" },
];

// 12 team names
const teamNames = [
  "Thunder",
  "Lightning",
  "Storm",
  "Blaze",
  "Frost",
  "Shadow",
  "Phoenix",
  "Titan",
  "Viper",
  "Falcon",
  "Wolf",
  "Eagle",
];

async function getByUnique<T>(collection: string, filter: string): Promise<T | null> {
  try {
    return await pb.collection(collection).getFirstListItem<T>(filter);
  } catch {
    return null;
  }
}

async function upsertPlayer(data: { name: string; gender: string }) {
  const existing = await getByUnique<any>("players", `name="${data.name}"`);
  if (existing) return existing;

  return await pb.collection("players").create(data);
}

async function upsertTeam(data: { name: string; malePlayer: string; femalePlayer: string }) {
  const existing = await getByUnique<any>("teams", `name="${data.name}"`);
  if (existing) return existing;

  return await pb.collection("teams").create(data);
}

async function main() {
  console.log(`Seeding players and teams via PB: ${PB_URL}`);

  // Admin auth
  await pb.collection("_superusers").authWithPassword(PB_ADMIN_EMAIL!, PB_ADMIN_PASSWORD!);
  console.log("✅ Admin authenticated");

  // Create all players
  console.log("\nCreating players...");
  const createdMales: any[] = [];
  const createdFemales: any[] = [];

  for (const player of malePlayers) {
    const created = await upsertPlayer(player);
    createdMales.push(created);
    console.log(`  ✅ ${player.name} (${player.gender})`);
  }

  for (const player of femalePlayers) {
    const created = await upsertPlayer(player);
    createdFemales.push(created);
    console.log(`  ✅ ${player.name} (${player.gender})`);
  }

  console.log(`\n✅ Created ${createdMales.length + createdFemales.length} players`);

  // Create teams (pair male[i] with female[i])
  console.log("\nCreating teams...");
  for (let i = 0; i < 12; i++) {
    const team = await upsertTeam({
      name: teamNames[i],
      malePlayer: createdMales[i].id,
      femalePlayer: createdFemales[i].id,
    });
    console.log(`  ✅ Team ${teamNames[i]}: ${createdMales[i].name} + ${createdFemales[i].name}`);
  }

  console.log("\n🎉 Seed complete: 24 players, 12 teams");
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
