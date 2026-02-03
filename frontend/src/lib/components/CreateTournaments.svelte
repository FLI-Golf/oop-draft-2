<script lang="ts">
  import { enhance } from "$app/forms";
  import * as nav from "$app/navigation";

  // shadcn-svelte (adjust paths if yours differ)
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Select, type SelectOption } from "$lib/components/ui/select";
  import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
  } from "$lib/components/ui/table";

  type SortKey = "name" | "date" | "course" | "season";
  let sortKey: SortKey = "date";
  let sortDir: "asc" | "desc" = "desc";

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      sortDir = sortDir === "asc" ? "desc" : "asc";
    } else {
      sortKey = key;
      // sensible default: dates desc, everything else asc
      sortDir = key === "date" ? "desc" : "asc";
    }
  }

  function sortIndicator(key: SortKey) {
    if (sortKey !== key) return "";
    return sortDir === "asc" ? " ▲" : " ▼";
  }

  function compare(a: any, b: any) {
    if (a === b) return 0;
    if (a == null) return -1;
    if (b == null) return 1;
    return a < b ? -1 : 1;
  }

  $: sortedTournaments = [...(data.tournaments ?? [])].sort((a, b) => {
    let av: any;
    let bv: any;

    switch (sortKey) {
      case "date":
        // ISO dates sort correctly as strings, but make it explicit:
        av = new Date(a.date).getTime();
        bv = new Date(b.date).getTime();
        break;
      case "name":
        av = (a.name ?? "").toLowerCase();
        bv = (b.name ?? "").toLowerCase();
        break;
      case "course":
        av = (a.expand?.course?.name ?? a.course ?? "").toLowerCase();
        bv = (b.expand?.course?.name ?? b.course ?? "").toLowerCase();
        break;
      case "season":
        av = a.season ?? "";
        bv = b.season ?? "";
        break;
    }

    const c = compare(av, bv);
    return sortDir === "asc" ? c : -c;
  });

  export let data: {
    courses: { id: string; name: string }[];
    tournaments: {
      id: string;
      name: string;
      date: string;
      course: string;
      season?: "2026" | "2027" | "2028" | "2029";
      expand?: { course?: { name: string } };
    }[];
  };

  let selectedCourseId = data.courses?.[0]?.id ?? "";
  let tournamentName = "FLI Championship";
  let tournamentDate = "2026-02-15";
  let season = "2026";

  const seasonOptions: SelectOption[] = [
    { value: "2026", label: "2026" },
    { value: "2027", label: "2027" },
    { value: "2028", label: "2028" },
    { value: "2029", label: "2029" }
  ];

  let status = "";
  let error = "";
  
</script>

<div class="flex items-start justify-between">
  <div class="space-y-1">
    <h1 class="text-3xl font-bold">Tournaments</h1>

    {#if status}
      <p class="text-sm text-emerald-600">{status}</p>
    {/if}

    {#if error}
      <p class="text-sm text-red-600">{error}</p>
    {/if}
  </div>

  <Button variant="outline" class="-mt-1" asChild>
    <a href="/work-order">← Return to Work Order</a>
  </Button>

  </div>

  <Card>
    <CardHeader>
      <CardTitle>Create tournament</CardTitle>
    </CardHeader>
    <CardContent class="space-y-4">
      <form
        method="POST"
        action="?/createTournament"
        use:enhance={() => {
          return async ({ result }) => {
            if (result.type === "success") {
              status = "Created ✅";
              error = "";
              tournamentName = "";
              // or keep name but bump date, your call
              await nav.invalidateAll();
              return;
            }

            if (result.type === "failure") {
              status = "";
              error = (result.data as { error?: string })?.error ?? "Create failed.";
              return;
            }

            status = "";
            error =
              result.type === "error"
                ? result.error?.message ?? "Unexpected error."
                : "Redirecting…";
          };
        }}
      >
        <div class="grid gap-3 sm:grid-cols-2">
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground" for="tseason">Season</label>

            <!-- Simple Select (no shadcn compound API) -->
            <Select
              bind:value={season}
              options={seasonOptions}
              placeholder="Select season"
            />

            <!-- ensure the season value is submitted -->
            <input type="hidden" name="season" value={season} />
          </div>

          <div class="space-y-1">
            <label class="text-xs text-muted-foreground" for="tname">Tournament name</label>
            <Input id="tname" name="name" bind:value={tournamentName} />
          </div>

          <div class="space-y-1">
            <label class="text-xs text-muted-foreground" for="tdate">Date</label>
            <Input id="tdate" name="date" type="date" bind:value={tournamentDate} />
          </div>

          <div class="space-y-1">
            <label class="text-xs text-muted-foreground" for="tcourse">Course</label>

            <!-- native select kept (works fine + submits) -->
            <select
              id="tcourse"
              name="course"
              class="w-full rounded-md border px-3 py-2 text-sm"
              bind:value={selectedCourseId}
              required
            >
              {#each data.courses as c}
                <option value={c.id}>{c.name}</option>
              {/each}
            </select>
          </div>
        </div>

        <div class="mt-4">
          <Button type="submit" disabled={!selectedCourseId || !season}>
            Create tournament
          </Button>
        </div>
      </form>
    </CardContent>
  </Card>

  <Card>
    <CardHeader>
      <CardTitle>All tournaments</CardTitle>
    </CardHeader>
    <CardContent>
      <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>

          <TableHead>
            <button
              type="button"
              class="flex items-center gap-1 hover:underline"
              on:click={() => toggleSort("date")}
            >
              Date{sortIndicator("date")}
            </button>
          </TableHead>

          <TableHead>Course</TableHead>
          <TableHead>Season</TableHead>
        </TableRow>
      </TableHeader>

        <TableBody>
          {#if data.tournaments.length === 0}
            <TableRow>
              <TableCell colspan="4" class="text-muted-foreground">No tournaments yet.</TableCell>
            </TableRow>
          {:else}
            {#each sortedTournaments as t}
              <TableRow>
                <TableCell>{t.name}</TableCell>
                <TableCell>{new Date(t.date).toDateString()}</TableCell>
                <TableCell>{t.expand?.course?.name ?? t.course}</TableCell>
                <TableCell>{t.season ?? "-"}</TableCell>
              </TableRow>
            {/each}
          {/if}
        </TableBody>
      </Table>
    </CardContent>
  </Card>

