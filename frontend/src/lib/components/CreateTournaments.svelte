<script lang="ts">
  import { enhance } from "$app/forms";
  import * as nav from "$app/navigation";

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

  // Multi-step form state
  let currentStep = 1;
  const totalSteps = 4;

  function nextStep() {
    if (currentStep < totalSteps) currentStep++;
  }

  function prevStep() {
    if (currentStep > 1) currentStep--;
  }

  function goToStep(step: number) {
    if (step >= 1 && step <= totalSteps) currentStep = step;
  }

  // Sorting for tournaments table
  type SortKey = "name" | "date" | "course" | "season";
  let sortKey: SortKey = "date";
  let sortDir: "asc" | "desc" = "desc";

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      sortDir = sortDir === "asc" ? "desc" : "asc";
    } else {
      sortKey = key;
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
        av = a.expand?.seasonId?.year ?? "";
        bv = b.expand?.seasonId?.year ?? "";
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
      seasonId?: string;
      expand?: { 
        course?: { name: string };
        seasonId?: { id: string; year: string; active: boolean };
      };
    }[];
    tournamentCountsBySeason: Record<string, number>;
    seasonSettingsMap: Record<string, SeasonSettings>;
    groupsExistBySeason: Record<string, boolean>;
  };

  let selectedCourseId = data.courses?.[0]?.id ?? "";
  let season = "2026";

  const seasonOptions: SelectOption[] = [
    { value: "2026", label: "2026" },
    { value: "2027", label: "2027" },
    { value: "2028", label: "2028" },
    { value: "2029", label: "2029" }
  ];

  let status = "";
  let error = "";

  // 6 tournament forms state
  type TournamentForm = {
    name: string;
    date: string;
    created: boolean;
    skip: boolean;
  };

  let tournamentForms: TournamentForm[] = [
    { name: "FLI Championship 1", date: "2026-02-15", created: false, skip: false },
    { name: "FLI Championship 2", date: "2026-03-17", created: false, skip: false },
    { name: "FLI Championship 3", date: "2026-04-16", created: false, skip: false },
    { name: "FLI Championship 4", date: "2026-05-16", created: false, skip: false },
    { name: "FLI Championship 5", date: "2026-06-15", created: false, skip: false },
    { name: "FLI Championship 6", date: "2026-07-15", created: false, skip: false },
  ];

  function markTournamentCreated(index: number) {
    tournamentForms[index].created = true;
  }

  function toggleTournamentSkip(index: number) {
    tournamentForms[index].skip = !tournamentForms[index].skip;
  }

  $: allTournamentsProcessed = tournamentForms.every(t => t.created || t.skip);
  $: allTournamentsCreated = tournamentForms.every(t => t.created);
  $: createdCount = tournamentForms.filter(t => t.created).length;
  $: uncreatedTournaments = tournamentForms.filter(t => !t.created);

  let isCreatingAll = false;

  async function createAllTournaments() {
    if (!selectedCourseId) {
      error = "Please select a course first.";
      return;
    }

    isCreatingAll = true;
    error = "";
    status = "Creating tournaments...";

    try {
      for (let i = 0; i < tournamentForms.length; i++) {
        if (tournamentForms[i].created) continue;

        const formData = new FormData();
        formData.append("name", tournamentForms[i].name);
        formData.append("date", tournamentForms[i].date);
        formData.append("course", selectedCourseId);
        formData.append("season", season);

        const response = await fetch("?/createTournament", {
          method: "POST",
          body: formData
        });

        const result = await response.json();
        
        if (result.type === "success") {
          markTournamentCreated(i);
          status = `Created ${createdCount + 1} of 6 tournaments...`;
        } else {
          throw new Error(result.data?.error || "Failed to create tournament");
        }
      }

      status = "All 6 tournaments created ✅";
      await nav.invalidateAll();
      nextStep();
    } catch (e: any) {
      error = e.message || "Failed to create tournaments";
      status = "";
    } finally {
      isCreatingAll = false;
    }
  }

  // Course form state
  let courseName = "";
  let baseHoleDistances = "";
  let courseStatus = "";
  let courseError = "";

  // Generate course with default name and random hole distances (250-400 range)
  function generateCourse() {
    courseName = "FLI Stadium";
    const distances = Array.from({ length: 9 }, () => 
      Math.floor(Math.random() * 151) + 250
    );
    baseHoleDistances = distances.join(",");
  }

  // Group generation state
  let groupSeasonSelect = "2026";
  $: groupTournamentCount = data.tournamentCountsBySeason[groupSeasonSelect] ?? 0;
  $: groupsAlreadyExist = data.groupsExistBySeason?.[groupSeasonSelect] ?? false;
  $: isValidGroupCount = groupTournamentCount >= 1 && groupTournamentCount <= 20 && !groupsAlreadyExist;

  // Prize pool state
  let prizePoolSeason = "2026";
  let prizePoolAmount = "4000000";
  $: currentSeasonSettings = data.seasonSettingsMap[prizePoolSeason];
  $: hasPrizePool = !!currentSeasonSettings?.prizePool;

  // Step labels
  const stepLabels = [
    "Prize Pool",
    "Course",
    "Tournament",
    "Settings"
  ];
</script>

<div class="space-y-6">
  <div class="flex items-start justify-between">
    <div class="space-y-1">
      <h1 class="text-3xl font-bold">Tournament Setup</h1>
      <p class="text-muted-foreground">Step {currentStep} of {totalSteps}: {stepLabels[currentStep - 1]}</p>

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

  <!-- Step Progress Indicator -->
  <div class="flex items-center justify-between mb-8">
    {#each Array(totalSteps) as _, i}
      <button
        type="button"
        class="flex flex-col items-center gap-1 group"
        onclick={() => goToStep(i + 1)}
      >
        <div
          class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors
            {currentStep === i + 1
              ? 'bg-emerald-600 text-white'
              : currentStep > i + 1
                ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-600'
                : 'bg-gray-100 text-gray-500 border border-gray-300'}"
        >
          {#if currentStep > i + 1}
            ✓
          {:else}
            {i + 1}
          {/if}
        </div>
        <span class="text-xs text-muted-foreground hidden sm:block">{stepLabels[i]}</span>
      </button>
      {#if i < totalSteps - 1}
        <div class="flex-1 h-1 mx-2 {currentStep > i + 1 ? 'bg-emerald-600' : 'bg-gray-200'}"></div>
      {/if}
    {/each}
  </div>

  <!-- Step 1: Season Prize Pool -->
  {#if currentStep === 1}
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
            return async ({ result, update }) => {
              console.log("[Step 1] Form result:", result.type, result);
              if (result.type === "success") {
                status = "Prize pool saved ✅";
                error = "";
                await update();
                nextStep();
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
  {/if}

  <!-- Step 2: Create Course -->
  {#if currentStep === 2}
    <Card>
      <CardHeader>
        <CardTitle>Step 2: Create Course</CardTitle>
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
            return async ({ result, update }) => {
              console.log("[Step 2] Form result:", result.type, result);
              if (result.type === "success") {
                courseStatus = "Course created ✅";
                courseError = "";
                courseName = "";
                baseHoleDistances = "";
                await update();
                nextStep();
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

          <!-- Generate button for course name and hole distances -->
          <div class="mt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onclick={generateCourse}
            >
              Generate
            </Button>
          </div>

          <div class="mt-4">
            <Button type="submit" disabled={!courseName || !baseHoleDistances}>
              Create course
            </Button>
          </div>
        </form>

        {#if data.courses.length > 0}
          <div class="mt-6 pt-4 border-t">
            <h4 class="text-sm font-medium mb-2">Existing Courses</h4>
            <ul class="text-sm text-muted-foreground space-y-1">
              {#each data.courses as course}
                <li>• {course.name}</li>
              {/each}
            </ul>
          </div>
        {/if}
      </CardContent>
    </Card>
  {/if}

  <!-- Step 3: Create Tournaments -->
  {#if currentStep === 3}
    <Card>
      <CardHeader>
        <CardTitle>Step 3: Create 6 Tournaments</CardTitle>
        <p class="text-sm text-muted-foreground">
          Create 6 tournaments for the season. Each tournament is spaced ~30 days apart.
        </p>
      </CardHeader>
      <CardContent class="space-y-4">
        <!-- Season and Course Selection -->
        <div class="grid gap-3 sm:grid-cols-2 pb-4 border-b">
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground">Season (applies to all)</label>
            <select
              class="w-full rounded-md border px-3 py-2 text-sm"
              bind:value={season}
            >
              <option value="2026">2026</option>
              <option value="2027">2027</option>
              <option value="2028">2028</option>
              <option value="2029">2029</option>
            </select>
          </div>

          <div class="space-y-1">
            <label class="text-xs text-muted-foreground">Course (applies to all)</label>
            <select
              class="w-full rounded-md border px-3 py-2 text-sm"
              bind:value={selectedCourseId}
            >
              {#each data.courses as c}
                <option value={c.id}>{c.name}</option>
              {/each}
            </select>
          </div>
        </div>

        <p class="text-sm text-muted-foreground">
          Progress: {createdCount} of 6 tournaments created (Skip any with checkbox)
        </p>

        <!-- 6 Tournament Forms -->
        <div class="grid gap-4">
          {#each tournamentForms as form, i}
            <div class="p-4 rounded-lg border {form.created ? 'bg-emerald-50 border-emerald-300' : form.skip ? 'bg-gray-50 border-gray-300' : 'bg-white'}">
              <form
                method="POST"
                action="?/createTournament"
                use:enhance={() => {
                  return async ({ result, update }) => {
                    if (result.type === "success") {
                      markTournamentCreated(i);
                      status = `Tournament ${i + 1} created ✅`;
                      error = "";
                      await update();
                      if (allTournamentsProcessed) {
                        nextStep();
                      }
                      return;
                    }

                    if (result.type === "failure") {
                      status = "";
                      error = (result.data as { error?: string })?.error ?? "Create failed.";
                      return;
                    }

                    status = "";
                    error = result.type === "error" ? result.error?.message ?? "Unexpected error." : "";
                  };
                }}
              >
                <input type="hidden" name="season" value={season} />
                <input type="hidden" name="course" value={selectedCourseId} />
                
                <div class="flex items-center gap-4">
                  <span class="text-lg font-bold text-gray-400 w-8">{i + 1}</span>
                  
                  <div class="flex-1 grid gap-3 sm:grid-cols-2">
                    <div class="space-y-1">
                      <label class="text-xs text-muted-foreground">Name</label>
                      <Input 
                        name="name" 
                        bind:value={form.name}
                        disabled={form.created || form.skip}
                      />
                    </div>

                    <div class="space-y-1">
                      <label class="text-xs text-muted-foreground">Date</label>
                      <Input 
                        name="date" 
                        type="date" 
                        bind:value={form.date}
                        disabled={form.created || form.skip}
                      />
                    </div>
                  </div>

                  <div class="flex items-center gap-2">
                    <label class="flex items-center gap-2 cursor-pointer" title="Skip creating this tournament">
                      <input 
                        type="checkbox" 
                        bind:checked={form.skip}
                        disabled={form.created}
                        class="w-4 h-4"
                      />
                      <span class="text-xs text-muted-foreground">Skip</span>
                    </label>
                  </div>

                  <div class="w-24">
                    {#if form.created}
                      <span class="text-emerald-600 font-medium text-sm">✓ Created</span>
                    {:else if form.skip}
                      <span class="text-gray-500 font-medium text-sm">Skipped</span>
                    {:else}
                      <Button type="submit" size="sm" disabled={!selectedCourseId}>
                        Create
                      </Button>
                    {/if}
                  </div>
                </div>
              </form>
            </div>
          {/each}
        </div>

        <!-- Tournaments Table -->
        {#if data.tournaments.length > 0}
          <div class="mt-6 pt-4 border-t">
            <h4 class="text-sm font-medium mb-2">All Tournaments</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>
                    <button
                      type="button"
                      class="flex items-center gap-1 hover:underline"
                      onclick={() => toggleSort("date")}
                    >
                      Date{sortIndicator("date")}
                    </button>
                  </TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Season</TableHead>
                  <TableHead class="w-12 text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {#each sortedTournaments as t}
                  <TableRow class="group">
                    <TableCell>{t.name}</TableCell>
                    <TableCell>{new Date(t.date).toDateString()}</TableCell>
                    <TableCell>{t.expand?.course?.name ?? t.course}</TableCell>
                    <TableCell>{t.expand?.seasonId?.year ?? "-"}</TableCell>
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
              </TableBody>
            </Table>
          </div>
        {/if}
      </CardContent>
    </Card>
  {/if}

  <!-- Step 4: Tournament Settings & Summary -->
  {#if currentStep === 4}
    <Card>
      <CardHeader>
        <CardTitle>Step 4: Tournament Settings</CardTitle>
        <p class="text-sm text-muted-foreground">
          Configuration complete! Your season schedule is set up and ready to use.
        </p>
      </CardHeader>
      <CardContent class="space-y-6">
        <!-- Summary Box -->
        <div class="rounded-lg border border-emerald-200 bg-emerald-50 p-6">
          <h3 class="text-lg font-semibold text-emerald-900 mb-4">✅ Season Setup Complete</h3>
          <div class="grid gap-3 sm:grid-cols-2">
            <div>
              <span class="text-sm text-emerald-700 font-medium">Prize Pool</span>
              <p class="text-lg font-bold text-emerald-900">${(currentSeasonSettings?.prizePool / 1000000).toFixed(0)}M</p>
            </div>
            <div>
              <span class="text-sm text-emerald-700 font-medium">Course</span>
              <p class="text-lg font-bold text-emerald-900">{data.courses.find(c => c.id === selectedCourseId)?.name || "FLI Stadium"}</p>
            </div>
            <div>
              <span class="text-sm text-emerald-700 font-medium">Tournaments Created</span>
              <p class="text-lg font-bold text-emerald-900">{data.tournaments.length}</p>
            </div>
            <div>
              <span class="text-sm text-emerald-700 font-medium">Season</span>
              <p class="text-lg font-bold text-emerald-900">{season}</p>
            </div>
          </div>
        </div>

        <!-- Default Settings -->
        <div class="rounded-lg border border-emerald-500 bg-emerald-50 p-4">
          <h4 class="font-semibold text-emerald-700 mb-2">Default Tournament Settings</h4>
          <ul class="space-y-2 text-sm text-emerald-700">
            <li>✓ Starting hole: 1</li>
            <li>✓ Group intervals: 10 minutes</li>
            <li>✓ First tee time: 8:00 AM</li>
            <li>✓ Format: Stroke play</li>
          </ul>
          <p class="text-xs text-emerald-600 mt-3 italic">Click the ⚙️ icon on any tournament to customize these settings</p>
        </div>

        <!-- Configure Individual Tournaments -->
        {#if data.tournaments.length > 0}
          <div>
            <h4 class="text-sm font-medium mb-3">Configure Individual Tournaments</h4>
            <div class="grid gap-2">
              {#each data.tournaments as t}
                <a
                  href={`/tournaments/${t.id}/settings`}
                  class="flex items-center justify-between p-3 rounded-md border hover:bg-gray-50 transition"
                >
                  <div>
                    <span class="font-medium">{t.name}</span>
                    <span class="text-sm text-muted-foreground ml-2">({new Date(t.date).toDateString()})</span>
                  </div>
                  <span class="text-muted-foreground">⚙️ Settings</span>
                </a>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Next Steps -->
        <div class="rounded-lg border p-4 bg-blue-50">
          <h4 class="font-semibold text-blue-900 mb-3">📋 Next Steps</h4>
          <ul class="space-y-2 text-sm text-blue-800">
            <li>• Visit <a href="/dashboard" class="underline font-semibold">Dashboard</a> to view tournament schedules and tee sheets</li>
            <li>• Go to <a href="/scoring" class="underline font-semibold">Live Scoring</a> to enter scores during tournaments</li>
            <li>• Check <a href="/league" class="underline font-semibold">League Standings</a> to track season progress</li>
            <li>• Customize tournament settings by clicking ⚙️ on any tournament above</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  {/if}

  <!-- Navigation Buttons -->
  <div class="flex items-center justify-between pt-4">
    <Button
      variant="outline"
      onclick={prevStep}
      disabled={currentStep === 1}
    >
      ← Previous
    </Button>

    <span class="text-sm text-muted-foreground">
      Step {currentStep} of {totalSteps}
    </span>

    {#if currentStep === 3 && uncreatedTournaments.length > 0}
      <Button
        onclick={createAllTournaments}
        disabled={isCreatingAll || !selectedCourseId}
      >
        {isCreatingAll ? "Creating..." : `Create ${uncreatedTournaments.length} & Next →`}
      </Button>
    {:else if currentStep === totalSteps}
      <a href="/displays" class="inline-flex">
        <Button variant="default">
          Complete & View Displays ✓
        </Button>
      </a>
    {:else}
      <Button
        onclick={nextStep}
        disabled={currentStep === totalSteps || (currentStep === 3 && !allTournamentsProcessed)}
      >
        Next →
      </Button>
    {/if}
  </div>
</div>
