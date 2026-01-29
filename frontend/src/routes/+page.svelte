<script lang="ts">
  import { enhance } from "$app/forms";

  export let data: {
    courses: { id: string; name: string }[];
    tournaments: {
      id: string;
      name: string;
      date: string;
      course: string;
      expand?: { course?: { name: string } };
    }[];
  };

  let selectedCourseId = data.courses?.[0]?.id ?? "";
  let tournamentName = "FLI Championship";
  let tournamentDate = "2026-02-15";

  let status = "";
  let error = "";
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
    <form
      method="POST"
      action="?/createTournament"
      use:enhance={({ result }) => {
        result
          .then(async (r) => {
            if (r.type === "success") {
              status = `Created ✅ (${r.data?.createdId ?? ""})`;
              error = "";
              // simplest refresh: full reload to re-run server load
              window.location.reload();
            } else {
              status = "";
              error = (r.data as any)?.error ?? "Create failed.";
            }
          })
          .catch(() => {
            status = "";
            error = "Create failed.";
          });
      }}
    >
      <div class="grid gap-3 sm:grid-cols-3">
        <div class="space-y-1">
          <label class="text-xs text-muted-foreground" for="tname">Tournament name</label>
          <input
            id="tname"
            name="name"
            class="w-full rounded-md border px-3 py-2 text-sm"
            bind:value={tournamentName}
          />
        </div>

        <div class="space-y-1">
          <label class="text-xs text-muted-foreground" for="tdate">Date</label>
          <input
            id="tdate"
            name="date"
            type="date"
            class="w-full rounded-md border px-3 py-2 text-sm"
            bind:value={tournamentDate}
          />
        </div>

        <div class="space-y-1">
          <label class="text-xs text-muted-foreground" for="tcourse">Course</label>
          <select
            id="tcourse"
            name="course"
            class="w-full rounded-md border px-3 py-2 text-sm"
            bind:value={selectedCourseId}
          >
            {#each data.courses as c}
              <option value={c.id}>{c.name}</option>
            {/each}
          </select>
        </div>
      </div>

      <div class="flex gap-2 mt-3">
        <button
          class="rounded-md bg-blue-600 text-white px-3 py-2 text-sm font-medium hover:bg-blue-700"
          disabled={!selectedCourseId}
        >
          Create tournament
        </button>
      </div>
    </form>
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
        {#if data.tournaments.length === 0}
          <tr>
            <td class="px-4 py-3 text-muted-foreground" colspan="3">
              No tournaments yet.
            </td>
          </tr>
        {:else}
          {#each data.tournaments as t}
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
