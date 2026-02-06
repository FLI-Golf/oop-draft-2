import PocketBase from "pocketbase";
import 'dotenv/config';

type DemoUser = {
  email: string;
  password: string;
  role: "Admin" | "Scorekeeper" | "Pro" | "Basic User";
  name?: string;
};

const PB_URL = process.env.PB_URL || "http://127.0.0.1:8090";
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL;
const PB_ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD;

const users: DemoUser[] = [
  { email: "admin@demo.com",       password: "Password123!", role: "Admin",       name: "Demo Admin" },
  { email: "scorekeeper@demo.com", password: "Password123!", role: "Scorekeeper", name: "Demo Scorekeeper" },
  { email: "pro@demo.com",         password: "Password123!", role: "Pro",         name: "Demo Pro" },
  { email: "user@demo.com",        password: "Password123!", role: "Basic User",  name: "Demo User" }
];

async function upsertUser(pb: PocketBase, u: DemoUser) {
  const collection = pb.collection("users");

  // 1) check if exists
  let existing: any = null;
  try {
    existing = await collection.getFirstListItem(`email="${u.email}"`);
  } catch {
    // not found
  }

  if (!existing) {
    // 2) create
    const created = await collection.create({
      email: u.email,
      password: u.password,
      passwordConfirm: u.password,
      // optional fields if your auth collection has them
      name: u.name ?? u.email.split("@")[0],
      role: u.role
    });

    // If email verification is enabled in your PB settings, you can disable it for demo,
    // or leave it and just use admin-created users.
    console.log(`Created: ${u.email} (${u.role}) -> id=${created.id}`);
    return;
  }

  // 3) update role (and name if you want)
  const updated = await collection.update(existing.id, {
    role: u.role,
    ...(u.name ? { name: u.name } : {})
  });

  console.log(`Updated: ${u.email} (${u.role}) -> id=${updated.id}`);
}

async function main() {
  if (!PB_ADMIN_EMAIL || !PB_ADMIN_PASSWORD) {
    throw new Error("Missing PB_ADMIN_EMAIL or PB_ADMIN_PASSWORD env vars.");
  }

  const pb = new PocketBase(PB_URL);

  // login as superuser/admin
  await pb.admins.authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD);
  console.log(`Admin authed against ${PB_URL}`);

  for (const u of users) {
    await upsertUser(pb, u);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
