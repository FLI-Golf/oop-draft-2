import PocketBase from "pocketbase";

// ---- Config ----
const PB_URL = process.env.PB_URL || "http://127.0.0.1:8090";
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL;
const PB_ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD;

if (!PB_ADMIN_EMAIL || !PB_ADMIN_PASSWORD) {
  console.error(
    "Missing PB_ADMIN_EMAIL or PB_ADMIN_PASSWORD env vars.\n" +
      "Example:\n" +
      "PB_URL=http://127.0.0.1:8090 PB_ADMIN_EMAIL=admin.com PB_ADMIN_PASSWORD=pass pnpm tsx seed-course.ts"
  );
  process.exit(1);
}

const pb = new PocketBase(PB_URL);


// ---- Helpers ----
async function getByUnique<T>(collection: string, filter: string): Promise<T | null> {
  try {
    // getFirstListItem throws if none found
    return await pb.collection(collection).getFirstListItem<T>(filter);
  } catch {
    return null;
  }
}

async function upsertCourse(courseName: string, baseHoleDistances: number[]) {
  const existing = await getByUnique<any>("courses", `name="${courseName}"`);
  if (existing) return existing;

  return await pb.collection("courses").create({
    name: courseName,
    baseHoleDistances
  });
}

async function upsertTournament(params: { name: string; date: string; courseId: string }) {
  const { name, date, courseId } = params;

  const existing = await getByUnique<any>(
    "tournaments",
    `name="${name}" && date="${date}" && course="${courseId}"`
  );
  if (existing) return existing;

  return await pb.collection("tournaments").create({
    name,
    date,
    course: courseId
  });
}


// ---- Main seed ----
async function main() {
  console.log(`Seeding via PB: ${PB_URL}`);

  // Admin auth
  await pb.collection("_superusers").authWithPassword(PB_ADMIN_EMAIL!, PB_ADMIN_PASSWORD!);
  console.log("✅ Admin authenticated");

  // Sample distances (9 tees) - tweak to your liking
  const front9 = [310, 295, 340, 265, 360, 315, 285, 370, 300]; // basket A
  const back9 =  [355, 315, 365, 290, 385, 340, 305, 395, 325]; // basket B

  // 1) Course
  const baseHoleDistances = [310, 295, 340, 265, 360, 315, 285, 370, 300];
  const course = await upsertCourse("FLI Stadium Course", baseHoleDistances);
  console.log(`✅ Course: ${course.name} (${course.id})`);
  // 4) Tournament
  const tournament = await upsertTournament({
    name: "FLI Championship",
    date: "2026-02-15",
    season: "2026",
    courseId: course.id
  });
  console.log(`✅ Tournament: ${tournament.name} (${tournament.id})`);

  console.log("🎉 Seed complete");
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
