import type { PageServerLoad, Actions } from "./$types";
import { fail } from "@sveltejs/kit";
import { getServerPB } from "$lib/server/pb";

type TournamentRecord = {
  id: string;
  name?: string;
  date?: string;
  course?: string;
  season?: string;
};

type TournamentSettingsRecord = {
  id: string;
  tournament: string;
  startingHole: number;
  intervalMinutes: number;
  firstTeeTime: string;
  format: string;
};

const SETTINGS_COLLECTION = "tournament_settings";

export const load: PageServerLoad = async ({ params }) => {
  const pb = getServerPB();
  const tournamentId = params.id;

  const tournament = await pb.collection("tournaments").getOne<TournamentRecord>(tournamentId);

  let settings: TournamentSettingsRecord;

  try {
    settings = await pb
      .collection(SETTINGS_COLLECTION)
      .getFirstListItem<TournamentSettingsRecord>(`tournament="${tournamentId}"`);
  } catch (e: any) {
    if (e?.status !== 404) throw e;

    // Create defaults if missing
    settings = await pb.collection(SETTINGS_COLLECTION).create<TournamentSettingsRecord>({
      tournament: tournamentId,
      startingHole: 1,
      intervalMinutes: 10,
      firstTeeTime: "08:00",
      format: "stroke"
    });
  }

  return { tournament, settings };
};

export const actions: Actions = {
  save: async ({ params, request }) => {
    const pb = getServerPB();
    const tournamentId = params.id;
    const data = await request.formData();

    const settingsId = String(data.get("settingsId") ?? "").trim();
    const startingHole = Number(data.get("startingHole"));
    const intervalMinutes = Number(data.get("intervalMinutes"));
    const firstTeeTime = String(data.get("firstTeeTime") ?? "").trim();
    const format = String(data.get("format") ?? "stroke").trim();

    if (!settingsId) return fail(400, { error: "Missing settingsId." });
    if (!Number.isFinite(startingHole) || startingHole < 1) {
      return fail(400, { error: "Starting hole must be >= 1." });
    }
    if (!Number.isFinite(intervalMinutes) || intervalMinutes < 1) {
      return fail(400, { error: "Interval minutes must be >= 1." });
    }
    if (!/^\d{2}:\d{2}$/.test(firstTeeTime)) {
      return fail(400, { error: "First tee time must be HH:MM (e.g. 08:00)." });
    }

    try {
      const updated = await pb.collection(SETTINGS_COLLECTION).update<TournamentSettingsRecord>(settingsId, {
        tournament: tournamentId,
        startingHole,
        intervalMinutes,
        firstTeeTime,
        format
      });

      return { success: true, settings: updated };
    } catch (e: any) {
      return fail(e?.status || 500, { error: e?.message || "Save failed." });
    }
  }
};
