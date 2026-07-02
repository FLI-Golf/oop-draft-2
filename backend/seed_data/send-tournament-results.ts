import fs from "node:fs";
import "dotenv/config";

const PAYLOAD_FILE = process.env.PAYLOAD_FILE || "./backend/seed_data/last-tournament-results.json";
const RESULTS_WEBHOOK_URL = process.env.RESULTS_WEBHOOK_URL;
const RESULTS_AUTH_TOKEN = process.env.RESULTS_AUTH_TOKEN;
const DRY_RUN = process.env.DRY_RUN !== "0";

if (!fs.existsSync(PAYLOAD_FILE)) {
  throw new Error(`Payload file not found: ${PAYLOAD_FILE}`);
}

if (!DRY_RUN && !RESULTS_WEBHOOK_URL) {
  throw new Error("Missing RESULTS_WEBHOOK_URL (set DRY_RUN=1 to print only).");
}

async function main() {
  const payloadRaw = fs.readFileSync(PAYLOAD_FILE, "utf-8");
  const payload = JSON.parse(payloadRaw);

  if (DRY_RUN) {
    console.log("DRY_RUN enabled. Payload preview:");
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };

  if (RESULTS_AUTH_TOKEN) {
    headers.Authorization = `Bearer ${RESULTS_AUTH_TOKEN}`;
  }

  const response = await fetch(RESULTS_WEBHOOK_URL!, {
    method: "POST",
    headers,
    body: JSON.stringify(payload)
  });

  const text = await response.text();
  console.log(`POST ${RESULTS_WEBHOOK_URL} -> ${response.status}`);
  if (text) console.log(text);

  if (!response.ok) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
