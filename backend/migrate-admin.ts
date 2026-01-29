import "dotenv/config";
import PocketBase from "pocketbase";

const url = process.env.POCKETBASE_URL!;
const email = process.env.POCKETBASE_ADMIN_EMAIL!;
const password = process.env.POCKETBASE_ADMIN_PASSWORD!;

if (!url || !email || !password) {
  throw new Error("Missing PocketBase admin env vars");
}

const pb = new PocketBase(url);

async function run() {
  await pb.admins.authWithPassword(email, password);

  // Create courses collection
  await pb.collections.create({
    name: "courses",
    type: "base",
    schema: [
      { name: "name", type: "text", required: true },
      { name: "baseHoleDistances", type: "json", required: true }
    ]
  });

  // Create tournaments collection
  await pb.collections.create({
    name: "tournaments",
    type: "base",
    schema: [
      { name: "name", type: "text", required: true },
      { name: "date", type: "date", required: true },
      {
        name: "course",
        type: "relation",
        required: true,
        options: { collectionId: "courses", maxSelect: 1 }
      }
    ]
  });

  console.log("✅ Collections created");
}

run().catch(console.error);
