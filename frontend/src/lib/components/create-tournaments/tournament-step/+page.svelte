<script lang="ts">
  /**
   * Tournament Step - Create and manage tournaments
   * Step 3 of tournament setup wizard
   */
  
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import TournamentFormGrid from './TournamentFormGrid.svelte';
  import TournamentsTable from './TournamentsTable.svelte';
  
  type TournamentRecord = {
    id: string;
    name: string;
    date: string;
    course: string;
    seasonId?: string;
    expand?: {
      course?: { name: string };
      seasonId?: { id: string; year: string; active: boolean };
    };
  };
  
  type CourseRecord = {
    id: string;
    name: string;
  };
  
  export let tournaments: TournamentRecord[] = [];
  export let courses: CourseRecord[] = [];
  export let selectedCourseId: string = '';
  export let season: string = '2026';
  export let onTournamentCreated: () => void = () => {};
  
  // Tournament form state - 6 default tournaments
  export let tournamentForms: Array<{
    name: string;
    date: string;
    created: boolean;
    skip: boolean;
  }> = [
    { name: 'FLI Championship 1', date: '2026-02-15', created: false, skip: false },
    { name: 'FLI Championship 2', date: '2026-03-17', created: false, skip: false },
    { name: 'FLI Championship 3', date: '2026-04-16', created: false, skip: false },
    { name: 'FLI Championship 4', date: '2026-05-16', created: false, skip: false },
    { name: 'FLI Championship 5', date: '2026-06-15', created: false, skip: false },
    { name: 'FLI Championship 6', date: '2026-07-15', created: false, skip: false },
  ];
  
  let status = '';
  let error = '';
  
  // Computed properties
  $: allTournamentsProcessed = tournamentForms.every(t => t.created || t.skip);
  $: createdCount = tournamentForms.filter(t => t.created).length;
  $: uncreatedTournaments = tournamentForms.filter(t => !t.created && !t.skip);
  
  function handleTournamentUpdate(index: number) {
    tournamentForms[index].created = true;
    tournamentForms = [...tournamentForms]; // Trigger reactivity
    onTournamentCreated();
    
    // Check if all are done
    if (allTournamentsProcessed) {
      status = 'All tournaments processed ✅';
    }
  }
  
  function handleSeasonChange(newSeason: string) {
    season = newSeason;
  }
  
  function handleCourseChange(newCourseId: string) {
    selectedCourseId = newCourseId;
  }
</script>

<Card>
  <CardHeader>
    <CardTitle>Step 3: Create 6 Tournaments</CardTitle>
    <p class="text-sm text-muted-foreground">
      Create 6 tournaments for the season. Each tournament is spaced ~30 days apart.
    </p>
  </CardHeader>
  <CardContent class="space-y-4">
    {#if status}
      <p class="text-sm text-emerald-600">{status}</p>
    {/if}
    {#if error}
      <p class="text-sm text-red-600">{error}</p>
    {/if}
    
    <!-- Season and Course Selection -->
    <div class="grid gap-3 sm:grid-cols-2 pb-4 border-b">
      <div class="space-y-1">
        <label class="text-xs text-muted-foreground" for="season-select">Season (applies to all)</label>
        <select
          id="season-select"
          class="w-full rounded-md border px-3 py-2 text-sm"
          bind:value={season}
          onchange={(e) => handleSeasonChange(e.currentTarget.value)}
        >
          <option value="2026">2026</option>
          <option value="2027">2027</option>
          <option value="2028">2028</option>
          <option value="2029">2029</option>
        </select>
      </div>

      <div class="space-y-1">
        <label class="text-xs text-muted-foreground" for="course-select">Course (applies to all)</label>
        <select
          id="course-select"
          class="w-full rounded-md border px-3 py-2 text-sm"
          bind:value={selectedCourseId}
          onchange={(e) => handleCourseChange(e.currentTarget.value)}
        >
          {#each courses as c}
            <option value={c.id}>{c.name}</option>
          {/each}
        </select>
      </div>
    </div>

    <p class="text-sm text-muted-foreground">
      Progress: {createdCount} of 6 tournaments created (Skip any with checkbox)
    </p>

    <!-- 6 Tournament Forms Grid -->
    <TournamentFormGrid
      bind:forms={tournamentForms}
      {selectedCourseId}
      {season}
      onTournamentUpdate={handleTournamentUpdate}
    />

    <!-- Tournaments Table -->
    {#if tournaments.length > 0}
      <TournamentsTable {tournaments} />
    {/if}
  </CardContent>
</Card>
