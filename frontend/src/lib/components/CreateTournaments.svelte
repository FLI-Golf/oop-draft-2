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

  type SeasonSettings = {
    id: string;
    season: string;
    prizePool: number;
    distributed: boolean;
  };

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
    tournamentCountsBySeason: Record<string, number>;
    seasonSettingsMap: Record<string, SeasonSettings>;
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

  // Course form state
  let courseName = "";
  let baseHoleDistances = "";
  let courseStatus = "";
  let courseError = "";

  // Group generation state
  let groupSeasonSelect = "2026";
  $: groupTournamentCount = data.tournamentCountsBySeason[groupSeasonSelect] ?? 0;
  $: isValidGroupCount = groupTournamentCount >= 1 && groupTournamentCount <= 20;

  // Prize pool state
  let prizePoolSeason = "2026";
  let prizePoolAmount = "4000000";
  $: currentSeasonSettings = data.seasonSettingsMap[prizePoolSeason];
  $: hasPrizePool = !!currentSeasonSettings?.prizePool;
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
      <CardTitle>Step 1: Season Prize Pool</CardTitle>
      <p class="text-sm text-muted-foreground">
        Set the total prize pool for a season. Prize money will be distributed across all tournaments ensuring every team gets paid.
      </p>
    </CardHeader>
    <CardContent class="space-y-4">
      <form
        method="POST"
        action="?/setSeasonPrizePool"
        use:enhance={() => {
          return async ({ result }) => {
            if (result.type === "success") {
              status = "Prize pool saved ✅";
              error = "";
              await nav.invalidateAll();
              return;
            }
            if (result.type === "failure") {
              status = "";
              error = (result.data as { error?: string })?.error ?? "Failed to set prize pool.";
              return;
            }
            status = "";
            error = result.type === "error" ? result.error?.message ?? "Unexpected error." : "";
          };
        }}
      >
        <div class="grid gap-3 sm:grid-cols-3">
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground" for="prizePoolSeason">Season</label>
            <select
              id="prizePoolSeason"
              name="season"
              bind:value={prizePoolSeason}
              class="w-full rounded-md border px-3 py-2 text-sm"
              required
            >
              <option value="2026">2026</option>
              <option value="2027">2027</option>
              <option value="2028">2028</option>
              <option value="2029">2029</option>
            </select>
          </div>

          <div class="space-y-1">
            <label class="text-xs text-muted-foreground" for="prizePoolAmount">Prize Pool</label>
            <select
              id="prizePoolAmount"
              name="prizePool"
              bind:value={prizePoolAmount}
              class="w-full rounded-md border px-3 py-2 text-sm"
              required
            >
              <option value="2000000">$2 Million</option>
              <option value="3000000">$3 Million</option>
              <option value="4000000">$4 Million</option>
              <option value="5000000">$5 Million</option>
              <option value="6000000">$6 Million</option>
            </select>
          </div>

          <div class="flex items-end">
            <Button type="submit">
              Set Prize Pool
            </Button>
          </div>
        </div>

        {#if currentSeasonSettings}
          <div class="mt-3 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">
            <strong>{prizePoolSeason} Prize Pool:</strong> ${(currentSeasonSettings.prizePool / 1000000).toFixed(0)}M
            {#if currentSeasonSettings.distributed}
              <span class="ml-2 text-emerald-600">(Distributed)</span>
            {:else}
              <span class="ml-2 text-amber-600">(Not yet distributed)</span>
            {/if}
          </div>
        {:else}
          <p class="mt-3 text-xs text-muted-foreground">No prize pool set for {prizePoolSeason} yet.</p>
        {/if}
      </form>
    </CardContent>
  </Card>

  <Card>
    <CardHeader>
      <CardTitle>Step 2: Create course</CardTitle>
      <p class="text-sm text-muted-foreground">
        Courses define the 9-hole layout with base distances. Create a course first, then use it when creating tournaments.
      </p>
    </CardHeader>
    <CardContent class="space-y-4">
      {#if courseStatus}
        <p class="text-sm text-emerald-600">{courseStatus}</p>
      {/if}
      {#if courseError}
        <p class="text-sm text-red-600">{courseError}</p>
      {/if}

      <form
        method="POST"
        action="?/createCourse"
        use:enhance={() => {
          return async ({ result }) => {
            if (result.type === "success") {
              courseStatus = "Course created ✅";
              courseError = "";
              courseName = "";
              baseHoleDistances = "";
              await nav.invalidateAll();
              return;
            }

            if (result.type === "failure") {
              courseStatus = "";
              courseError = (result.data as { courseError?: string })?.courseError ?? "Create failed.";
              return;
            }

            courseStatus = "";
            courseError =
              result.type === "error"
                ? result.error?.message ?? "Unexpected error."
                : "Redirecting…";
          };
        }}
      >
        <div class="grid gap-3 sm:grid-cols-2">
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground" for="courseName">Course name</label>
            <Input id="courseName" name="courseName" bind:value={courseName} placeholder="FLI Stadium" required />
          </div>

          <div class="space-y-1">
            <label class="text-xs text-muted-foreground" for="baseHoleDistances">
              Base hole distances (9 numbers, comma-separated)
            </label>
            <Input
              id="baseHoleDistances"
              name="baseHoleDistances"
              bind:value={baseHoleDistances}
              placeholder="310,295,340,265,360,315,285,370,300"
              required
            />
          </div>
        </div>

        <div class="mt-4">
          <Button type="submit" disabled={!courseName || !baseHoleDistances}>
            Create course
          </Button>
        </div>
      </form>
    </CardContent>
  </Card>

  <Card>
    <CardHeader>
      <CardTitle>Step 3: Create tournament</CardTitle>
      <p class="text-sm text-muted-foreground">
        Tournaments are events held on a course during a season. Select a course from the dropdown (created above).
      </p>
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

            <!-- Settings column -->
            <TableHead class="w-12 text-right"></TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {#if data.tournaments.length === 0}
            <TableRow>
              <TableCell colspan="5" class="text-muted-foreground">No tournaments yet.</TableCell>
            </TableRow>
          {:else}
            {#each sortedTournaments as t}
              <TableRow class="group">
                <TableCell>{t.name}</TableCell>
                <TableCell>{new Date(t.date).toDateString()}</TableCell>
                <TableCell>{t.expand?.course?.name ?? t.course}</TableCell>
                <TableCell>{t.season ?? "-"}</TableCell>

                <TableCell class="text-right">
                  <a
                    href={`/tournaments/${t.id}/settings`}
                    class="inline-flex items-center justify-center rounded-md p-2 opacity-0 transition group-hover:opacity-100 hover:bg-black/10 focus:outline-none focus:ring"
                    aria-label={`Open settings for ${t.name}`}
                    title="Tournament settings"
                  >
                    ⚙️
                  </a>
                </TableCell>
              </TableRow>
            {/each}
          {/if}
        </TableBody>
      </Table>
    </CardContent>
  </Card>

  <Card>
    <CardHeader>
      <CardTitle>Next Steps</CardTitle>
      <p class="text-sm text-muted-foreground">
        After creating a tournament, configure these settings before the event.
      </p>
    </CardHeader>
    <CardContent class="space-y-4">
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div class="rounded-lg border border-emerald-500 bg-emerald-50 p-4">
          <h3 class="font-semibold text-emerald-700">Step 4: Tournament Settings ✓</h3>
          <p class="mt-1 text-sm text-emerald-600">
            Configure tee times, starting hole, and format. Default: all groups start at hole 1 with 10-minute intervals.
          </p>
          <p class="mt-2 text-xs text-emerald-600 font-medium">Completed</p>
        </div>

        <div class="rounded-lg border p-4">
          <h3 class="font-semibold">Step 5: Create Groups</h3>
          <p class="mt-1 text-sm text-muted-foreground">
            Organize teams into groups (2 teams per group). Groups are assigned tee times automatically.
            Generate diverse matchups across all tournaments in a season (1-20 tournaments required).
          </p>
          <form method="POST" action="?/generateGroups" use:enhance={() => {
            return async ({ result }) => {
              if (result.type === "success") {
                status = "Groups generated for season ✅";
                error = "";
                await nav.invalidateAll();
                return;
              }
              if (result.type === "failure") {
                status = "";
                error = (result.data as { error?: string })?.error ?? "Generation failed.";
                return;
              }
              status = "";
              error = result.type === "error" ? result.error?.message ?? "Unexpected error." : "";
            };
          }}>
            <div class="mt-3 flex items-center gap-2">
              <select name="season" bind:value={groupSeasonSelect} class="rounded-md border px-3 py-2 text-sm" required>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
                <option value="2028">2028</option>
                <option value="2029">2029</option>
              </select>
              <Button type="submit" variant="outline" size="sm" disabled={!isValidGroupCount}>
                Generate Groups ({groupTournamentCount} tournament{groupTournamentCount !== 1 ? 's' : ''})
              </Button>
            </div>
            {#if groupTournamentCount === 0}
              <p class="mt-2 text-xs text-amber-600">No tournaments for this season. Create tournaments first.</p>
            {:else if groupTournamentCount > 20}
              <p class="mt-2 text-xs text-red-600">Too many tournaments ({groupTournamentCount}). Maximum is 20.</p>
            {/if}
          </form>
        </div>

        <div class="rounded-lg border p-4">
          <h3 class="font-semibold">Step 6: Generate Tee Sheet</h3>
          <p class="mt-1 text-sm text-muted-foreground">
            View and print the tee sheet showing all groups, times, and starting holes.
          </p>
          <p class="mt-2 text-xs text-muted-foreground italic">Coming soon</p>
        </div>

        <div class="rounded-lg border p-4">
          <h3 class="font-semibold">Step 7: Live Scoring</h3>
          <p class="mt-1 text-sm text-muted-foreground">
            Scorekeepers enter scores hole-by-hole during the tournament.
          </p>
          <p class="mt-2 text-xs text-muted-foreground italic">Coming soon</p>
        </div>

        <div class="rounded-lg border p-4">
          <h3 class="font-semibold">Step 8: Leaderboard</h3>
          <p class="mt-1 text-sm text-muted-foreground">
            Real-time leaderboard showing player standings and scores.
          </p>
          <p class="mt-2 text-xs text-muted-foreground italic">Coming soon</p>
        </div>
      </div>
    </CardContent>
  </Card>

