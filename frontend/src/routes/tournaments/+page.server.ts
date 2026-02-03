import type { PageServerLoad, Actions } from "./$types";
import { fail } from "@sveltejs/kit";
import { getServerPB } from "$lib/server/pb";

type CourseRecord = {
  id: string;
  name: string;
  baseHoleDistances: number[];
};

type TournamentRecord = {
  id: string;
  name: string;
  date: string;
  course: string;
  season?: "2026" | "2027" | "2028" | "2029";
  expand?: {
    course?: CourseRecord;
  };
};

export const load: PageServerLoad = async () => {
  const pb = getServerPB();

  const courses = await pb.collection("courses").getFullList<CourseRecord>({
    sort: "name"
  });

  const tournaments = await pb.collection("tournaments").getFullList<TournamentRecord>({
    sort: "-date",
    expand: "course"
  });

  return { courses, tournaments };
};

export const actions: Actions = {
  createCourse: async ({ request }) => {
    const pb = getServerPB();
    const data = await request.formData();

    const name = String(data.get("courseName") ?? "").trim();
    const distancesRaw = String(data.get("baseHoleDistances") ?? "").trim();

    if (!name || !distancesRaw) {
      return fail(400, { courseError: "Missing required fields." });
    }

    // Parse comma or space separated distances
    const distances = distancesRaw
      .split(/[\s,]+/)
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !isNaN(n));

    if (distances.length !== 9 || !distances.every((n) => isFinite(n))) {
      return fail(400, { courseError: "Distances must be exactly 9 valid numbers." });
    }

    try {
      const created = await pb.collection("courses").create<CourseRecord>({
        name,
        baseHoleDistances: distances
      });

      return { courseSuccess: true, createdCourseId: created.id };
    } catch (e: any) {
      return fail(e?.status || 500, {
        courseError: e?.message || "Create course failed."
      });
    }
  },

  createTournament: async ({ request }) => {
    const pb = getServerPB();
    const data = await request.formData();

    const name = String(data.get("name") ?? "").trim();
    const date = String(data.get("date") ?? "").trim();
    const course = String(data.get("course") ?? "").trim();
    const season = String(data.get("season") ?? "").trim();

    const allowedSeasons = new Set(["2026", "2027", "2028", "2029"]);

    if (!name || !date || !course || !season) {
      return fail(400, { error: "Missing required fields." });
    }

    if (!allowedSeasons.has(season)) {
      return fail(400, { error: "Invalid season." });
    }

    try {
      const created = await pb.collection("tournaments").create<TournamentRecord>({
        name,
        date,
        course,
        season
      });

      return { success: true, createdId: created.id };
    } catch (e: any) {
      return fail(e?.status || 500, {
        error: e?.message || "Create failed (rules/auth)."
      });
    }
  }
};

