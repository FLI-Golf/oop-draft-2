import PocketBase from "pocketbase";
import 'dotenv/config'

type TournamentRecord = { id: string; name?: string };
type TournamentSettingsRecord = { id: string; tournament: string };

const PB_URL = process.env.PB_URL;
const ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL ?? process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD ?? process.env.POCKETBASE_ADMIN_PASSWORD;

if (!PB_URL || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  throw new Error(
    "Missing PB_URL or admin credentials (PB_ADMIN_* or POCKETBASE_ADMIN_*)."
  );
}

const pb = new PocketBase(PB_URL);

// change ONLY if your actual collection slug differs
const SETTINGS_COLLECTION = "tournament_settings";

async function main() {
  await pb.collection("_superusers").authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
  console.log(`Admin authed against ${PB_URL}`);

  // --- Debug: confirm the settings collection exists and print suggestions if not ---
  try {
    await pb.collection(SETTINGS_COLLECTION).getList(1, 1, { skipTotal: true });
  } catch (e: any) {
    // Print available collection names so you can see the correct slug
    console.error(
      `\nCould not access collection "${SETTINGS_COLLECTION}".\n` +
      `This usually means the collection slug is different or migrations weren't applied to this pb_data.\n`
    );

    try {
      // Works in many PB setups because the PocketBase JS SDK exposes admin endpoints.
      const cols = await (pb as any).collections.getFullList({ perPage: 200 });
      console.error(
        "Available collections:\n- " + cols.map((c: any) => c.name).join("\n- ")
      );
      console.error(
        `\nUpdate SETTINGS_COLLECTION to the correct name shown above, then rerun.\n`
      );
    } catch {
      console.error(
        "Could not list collections via SDK. Open Admin UI → Collections → click your settings collection → copy its Name (slug)."
      );
    }

    throw e;
  }

  const tournaments = await pb.collection("tournaments").getFullList<TournamentRecord>({
    perPage: 200,
  });

  console.log(`Found ${tournaments.length} tournament(s)`);

  for (const t of tournaments) {
    const existing = await pb
      .collection(SETTINGS_COLLECTION)
      .getFullList<TournamentSettingsRecord>({
        filter: `tournament="${t.id}"`,
        perPage: 1,
      });

    if (existing.length > 0) {
      console.log(`Settings already exist for: ${t.name ?? t.id}`);
      continue;
    }

    await pb.collection(SETTINGS_COLLECTION).create({
      tournament: t.id,
      startingHole: 1,
      intervalMinutes: 10,
      firstTeeTime: "08:00",
      format: "stroke",
    });

    console.log(`Created settings for: ${t.name ?? t.id}`);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
