import PocketBase from "pocketbase";

// ---- Config ----
const PB_URL = process.env.PB_URL || "http://127.0.0.1:8090";
const ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error(
    "Missing PB_ADMIN_EMAIL or PB_ADMIN_PASSWORD env vars.\n" +
      "Example:\n" +
      "PB_URL=http://127.0.0.1:8090 PB_ADMIN_EMAIL=admin@example.com PB_ADMIN_PASSWORD=pass pnpm tsx seed-course.ts"
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

async function upsertCourse(courseName: string) {
  const existing = await getByUnique<any>("courses", `name="${courseName}"`);
  if (existing) return existing;

  return await pb.collection("courses").create({
    name: courseName
  });
}

async function ensureCourseHoles(courseId: string) {
  // Get existing holes for this course
  const holes = await pb.collection("course_holes").getFullList<any>({
    filter: `course="${courseId}"`,
    sort: "teeNumber"
  });

  const existingNumbers = new Set<number>(holes.map((h) => h.teeNumber));

  // Create missing tee numbers 1..9
  for (let teeNumber = 1; teeNumber <= 9; teeNumber++) {
    if (!existingNumbers.has(teeNumber)) {
      await pb.collection("course_holes").create({
        course: courseId,
        teeNumber
      });
    }
  }

  // Return fresh list
  return await pb.collection("course_holes").getFullList<any>({
    filter: `course="${courseId}"`,
    sort: "teeNumber"
  });
}

async function ensureHoleLayouts(courseHoles: any[], front9: number[], back9: number[], par = 3) {
  if (front9.length !== 9 || back9.length !== 9) {
    throw new Error("front9 and back9 must both be arrays of length 9");
  }

  for (const ch of courseHoles) {
    const idx = ch.teeNumber - 1;

    // A (front 9)
    const existingA = await getByUnique<any>(
      "hole_layouts",
      `courseHole="${ch.id}" && basketPosition="A"`
    );
    if (!existingA) {
      await pb.collection("hole_layouts").create({
        courseHole: ch.id,
        basketPosition: "A",
        distance: front9[idx],
        par
      });
    }

    // B (back 9)
    const existingB = await getByUnique<any>(
      "hole_layouts",
      `courseHole="${ch.id}" && basketPosition="B"`
    );
    if (!existingB) {
      await pb.collection("hole_layouts").create({
        courseHole: ch.id,
        basketPosition: "B",
        distance: back9[idx],
        par
      });
    }
  }
}

async function upsertTournament(params: { name: string; date: string; season: string; courseId: string }) {
  const { name, date, season, courseId } = params;

  const existing = await getByUnique<any>(
    "tournaments",
    `name="${name}" && date="${date}" && course="${courseId}"`
  );
  if (existing) return existing;

  return await pb.collection("tournaments").create({
    name,
    date,
    season,
    course: courseId
  });
}

// ---- Main seed ----
async function main() {
  console.log(`Seeding via PB: ${PB_URL}`);

  // Admin auth
  await pb.admins.authWithPassword(ADMIN_EMAIL!, ADMIN_PASSWORD!);
  console.log("✅ Admin authenticated");

  // Sample distances (9 tees) - tweak to your liking
  const front9 = [310, 295, 340, 265, 360, 315, 285, 370, 300]; // basket A
  const back9 =  [355, 315, 365, 290, 385, 340, 305, 395, 325]; // basket B

  // 1) Course
  const course = await upsertCourse("FLI Stadium Course");
  console.log(`✅ Course: ${course.name} (${course.id})`);

  // 2) Course holes (1-9)
  const courseHoles = await ensureCourseHoles(course.id);
  console.log(`✅ Course holes: ${courseHoles.length} (should be 9)`);

  // 3) Hole layouts (A/B)
  await ensureHoleLayouts(courseHoles, front9, back9, 3);
  console.log("✅ Hole layouts ensured (A/B for each tee)");

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
