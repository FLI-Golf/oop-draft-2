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
  createTournament: async ({ request }) => {
    const pb = getServerPB();
    const data = await request.formData();

    const name = String(data.get("name") ?? "").trim();
    const date = String(data.get("date") ?? "").trim();
    const course = String(data.get("course") ?? "").trim();

    if (!name || !date || !course) {
      return fail(400, { error: "Missing required fields." });
    }

    try {
      const created = await pb.collection("tournaments").create<TournamentRecord>({
        name,
        date,
        course
      });

      return { success: true, createdId: created.id };
    } catch (e: any) {
      // If rules/auth fail, PocketBase will throw with status/message
      return fail(e?.status || 500, {
        error: e?.message || "Create failed (rules/auth)."
      });
    }
  }
};
