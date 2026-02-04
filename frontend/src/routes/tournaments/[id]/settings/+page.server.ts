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

  scoringModel?: string;
  groupSize?: number;
};

const SETTINGS_COLLECTION = "tournament_settings";

const ALLOWED_SCORING_MODELS = new Set([
  "standard_match_total_strokes",
  "playoff_total_distance",
  "playoff_sudden_death_hole"
]);

export const load: PageServerLoad = async ({ params }) => {
  const pb = getServerPB();
  const tournamentId = params.id;

  const tournament = await pb
    .collection("tournaments")
    .getOne<TournamentRecord>(tournamentId);

  let settings: TournamentSettingsRecord;

  try {
    settings = await pb
      .collection(SETTINGS_COLLECTION)
      .getFirstListItem<TournamentSettingsRecord>(
        `tournament="${tournamentId}"`
      );
  } catch (e: any) {
    if (e?.status !== 404) throw e;

    // Create defaults if missing
    settings = await pb
      .collection(SETTINGS_COLLECTION)
      .create<TournamentSettingsRecord>({
        tournament: tournamentId,
        startingHole: 1,
        intervalMinutes: 10,
        firstTeeTime: "08:00",
        format: "stroke",
        scoringModel: "standard_match_total_strokes",
        groupSize: 2
      });
  }

  // Backfill for older records (NO DB WRITE)
  if (!settings.scoringModel) {
    settings.scoringModel =
      settings.format === "cth"
        ? "playoff_total_distance"
        : "standard_match_total_strokes";
  }

  if (!settings.groupSize) {
    settings.groupSize = 2;
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

    const scoringModel = String(
      data.get("scoringModel") ?? "standard_match_total_strokes"
    ).trim();

    const groupSize = Number(data.get("groupSize") ?? 2);

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

    if (!ALLOWED_SCORING_MODELS.has(scoringModel)) {
      return fail(400, { error: "Invalid scoring model." });
    }

    if (!Number.isFinite(groupSize) || groupSize < 2 || groupSize > 4) {
      return fail(400, { error: "Group size must be 2–4." });
    }

    // Enforce head-to-head stroke play
    if (format === "stroke" && groupSize !== 2) {
      return fail(400, {
        error: "Stroke format requires group size of 2."
      });
    }

    try {
      const updated = await pb
        .collection(SETTINGS_COLLECTION)
        .update<TournamentSettingsRecord>(settingsId, {
          tournament: tournamentId,
          startingHole,
          intervalMinutes,
          firstTeeTime,
          format,
          scoringModel,
          groupSize
        });

      return { success: true, settings: updated };
    } catch (e: any) {
      return fail(e?.status || 500, {
        error: e?.message || "Save failed."
      });
    }
  }
};
