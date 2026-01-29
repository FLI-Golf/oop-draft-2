<script lang="ts">
  import { onMount } from "svelte";
  import { pb } from "$lib/pb";

  type CourseRecord = {
    id: string;
    name: string;
    baseHoleDistances: number[];
  };

  type TournamentRecord = {
    id: string;
    name: string;
    date: string; // PB returns ISO date strings
    course: string; // relation id
    expand?: {
      course?: CourseRecord;
    };
  };

  let courses: CourseRecord[] = [];
  let tournaments: TournamentRecord[] = [];

  let selectedCourseId = "";
  let tournamentName = "FLI Championship";
  let tournamentDate = "2026-02-15";

  let status = "";
  let error = "";

  async function load() {
    error = "";
    status = "Loading…";

    try {
      courses = await pb.collection("courses").getFullList<CourseRecord>({
        sort: "name"
      });

      if (!selectedCourseId && courses.length) selectedCourseId = courses[0].id;

      tournaments = await pb.collection("tournaments").getFullList<TournamentRecord>({
        sort: "-date",
        expand: "course"
      });

      status = "Loaded ✅";
    } catch (e) {
      console.error(e);
      error = "Failed to load data (check PocketBase URL + rules).";
      status = "";
    }
  }

  async function createTournament() {
    error = "";
    status = "Creating tournament…";

    try {
      const created = await pb.collection("tournaments").create<TournamentRecord>({
        name: tournamentName,
        date: tournamentDate,
        course: selectedCourseId
      });

      status = `Created ✅ (${created.id})`;
      await load();
    } catch (e) {
      console.error(e);
      error =
        "Create failed (likely rules/auth). If you see 403/401 in console, we need to change PocketBase rules or add auth.";
      status = "";
    }
  }

  onMount(load);
</script>

<div class="p-6 space-y-6 max-w-3xl">
  <h1 class="text-3xl font-bold text-blue-600">Tournaments</h1>

  {#if status}
    <p class="text-sm text-green-700">{status}</p>
  {/if}
  {#if error}
    <p class="text-sm text-red-600">{error}</p>
  {/if}

  <div class="rounded-lg border p-4 space-y-3">
    <div class="grid gap-3 sm:grid-cols-3">
      <div class="space-y-1">
        <label class="text-xs text-muted-foreground">Tournament name</label>
        <input
          class="w-full rounded-md border px-3 py-2 text-sm"
          bind:value={tournamentName}
        />
      </div>

      <div class="space-y-1">
        <label class="text-xs text-muted-foreground">Date</label>
        <input
          type="date"
          class="w-full rounded-md border px-3 py-2 text-sm"
          bind:value={tournamentDate}
        />
      </div>

      <div class="space-y-1">
        <label class="text-xs text-muted-foreground">Course</label>
        <select
          class="w-full rounded-md border px-3 py-2 text-sm"
          bind:value={selectedCourseId}
        >
          {#each courses as c}
            <option value={c.id}>{c.name}</option>
          {/each}
        </select>
      </div>
    </div>

    <div class="flex gap-2">
      <button
        class="rounded-md bg-blue-600 text-white px-3 py-2 text-sm font-medium hover:bg-blue-700"
        on:click={createTournament}
        disabled={!selectedCourseId}
      >
        Create tournament
      </button>

      <button
        class="rounded-md border px-3 py-2 text-sm hover:bg-muted/50"
        on:click={load}
      >
        Refresh
      </button>
    </div>
  </div>

  <div class="rounded-lg border overflow-hidden">
    <table class="w-full text-sm">
      <thead class="bg-muted/50">
        <tr class="border-b">
          <th class="text-left font-medium px-4 py-3">Name</th>
          <th class="text-left font-medium px-4 py-3">Date</th>
          <th class="text-left font-medium px-4 py-3">Course</th>
        </tr>
      </thead>
      <tbody>
        {#if tournaments.length === 0}
          <tr>
            <td class="px-4 py-3 text-muted-foreground" colspan="3">
              No tournaments yet.
            </td>
          </tr>
        {:else}
          {#each tournaments as t}
            <tr class="border-b last:border-0 hover:bg-muted/50">
              <td class="px-4 py-3">{t.name}</td>
              <td class="px-4 py-3">{new Date(t.date).toDateString()}</td>
              <td class="px-4 py-3">{t.expand?.course?.name ?? t.course}</td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>
</div>
