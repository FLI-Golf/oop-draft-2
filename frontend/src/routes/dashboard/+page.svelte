<script lang="ts">
  import { goto } from "$app/navigation";
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
  } from "$lib/components/ui/table";

  export let data;

  $: tournaments = data.tournaments ?? [];
  $: groups = data.groups ?? [];
  $: selectedTournament = data.selectedTournament;
  $: tournamentSettings = data.tournamentSettings;
  $: selectedSeason = data.selectedSeason;
  $: selectedTournamentId = data.selectedTournamentId;

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  }

  function formatTeeTime(time: string): string {
    if (!time) return "-";
    const [hours, minutes] = time.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${String(minutes).padStart(2, "0")} ${period}`;
  }

  function handleSeasonChange(event: Event) {
    const season = (event.target as HTMLSelectElement).value;
    goto(`/dashboard?season=${season}`);
  }

  function handleTournamentChange(event: Event) {
    const tournamentId = (event.target as HTMLSelectElement).value;
    goto(`/dashboard?season=${selectedSeason}&tournament=${tournamentId}`);
  }
</script>

<div class="p-6 max-w-7xl mx-auto space-y-6">
  <div class="flex items-start justify-between">
    <div class="space-y-1">
      <h1 class="text-3xl font-bold">Tournaments Dashboard</h1>
      <p class="text-muted-foreground">View tee sheets, groups, and tournament details</p>
    </div>

    <Button variant="outline" asChild>
      <a href="/tournaments">← Back to Admin</a>
    </Button>
  </div>

  <!-- Filters -->
  <Card>
    <CardContent class="pt-6">
      <div class="flex flex-wrap gap-4">
        <div class="space-y-1">
          <label class="text-xs text-muted-foreground" for="season">Season</label>
          <select
            id="season"
            class="rounded-md border px-3 py-2 text-sm"
            value={selectedSeason}
            on:change={handleSeasonChange}
          >
            <option value="2026">2026</option>
            <option value="2027">2027</option>
            <option value="2028">2028</option>
            <option value="2029">2029</option>
          </select>
        </div>

        <div class="space-y-1">
          <label class="text-xs text-muted-foreground" for="tournament">Tournament</label>
          <select
            id="tournament"
            class="rounded-md border px-3 py-2 text-sm min-w-[200px]"
            value={selectedTournamentId}
            on:change={handleTournamentChange}
          >
            {#each tournaments as t}
              <option value={t.id}>{t.name} - {formatDate(t.date)}</option>
            {/each}
          </select>
        </div>
      </div>
    </CardContent>
  </Card>

  {#if selectedTournament}
    <!-- Tournament Info -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium text-muted-foreground">Tournament</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-xl font-bold">{selectedTournament.name}</div>
          <p class="text-xs text-muted-foreground">{formatDate(selectedTournament.date)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium text-muted-foreground">Course</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-xl font-bold">{selectedTournament.expand?.course?.name ?? "-"}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium text-muted-foreground">Format</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-xl font-bold capitalize">{tournamentSettings?.format ?? "stroke"}</div>
          <p class="text-xs text-muted-foreground">Starting hole: {tournamentSettings?.startingHole ?? 1}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium text-muted-foreground">Groups</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-xl font-bold">{groups.length}</div>
          <p class="text-xs text-muted-foreground">
            First tee: {formatTeeTime(tournamentSettings?.firstTeeTime ?? "08:00")}
          </p>
        </CardContent>
      </Card>
    </div>

    <!-- Tee Sheet -->
    <Card>
      <CardHeader>
        <CardTitle>Tee Sheet</CardTitle>
        <p class="text-sm text-muted-foreground">
          Groups, tee times, and team matchups for {selectedTournament.name}
        </p>
      </CardHeader>
      <CardContent>
        {#if groups.length === 0}
          <p class="text-muted-foreground">No groups generated yet. Generate groups from the Tournaments Admin page.</p>
        {:else}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead class="w-20">Group</TableHead>
                <TableHead class="w-24">Tee Time</TableHead>
                <TableHead class="w-20">Hole</TableHead>
                <TableHead>Team 1</TableHead>
                <TableHead>Team 2</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {#each groups as group}
                <TableRow>
                  <TableCell class="font-medium">{group.groupNumber}</TableCell>
                  <TableCell>{formatTeeTime(group.teeTime)}</TableCell>
                  <TableCell>{group.startingHole}</TableCell>
                  <TableCell>
                    {#if group.team1Data}
                      <div class="font-medium">{group.team1Data.name}</div>
                      <div class="text-xs text-muted-foreground">
                        {group.team1Data.expand?.malePlayer?.name ?? "-"} / {group.team1Data.expand?.femalePlayer?.name ?? "-"}
                      </div>
                    {:else}
                      -
                    {/if}
                  </TableCell>
                  <TableCell>
                    {#if group.team2Data}
                      <div class="font-medium">{group.team2Data.name}</div>
                      <div class="text-xs text-muted-foreground">
                        {group.team2Data.expand?.malePlayer?.name ?? "-"} / {group.team2Data.expand?.femalePlayer?.name ?? "-"}
                      </div>
                    {:else}
                      -
                    {/if}
                  </TableCell>
                </TableRow>
              {/each}
            </TableBody>
          </Table>
        {/if}
      </CardContent>
    </Card>

    <!-- All Tournaments in Season -->
    <Card>
      <CardHeader>
        <CardTitle>Season {selectedSeason} Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {#each tournaments as t}
            <button
              class="rounded-lg border p-4 text-left transition hover:bg-muted/50 {t.id === selectedTournamentId ? 'border-emerald-500 bg-emerald-50' : ''}"
              on:click={() => goto(`/dashboard?season=${selectedSeason}&tournament=${t.id}`)}
            >
              <h3 class="font-semibold">{t.name}</h3>
              <p class="text-sm text-muted-foreground">{formatDate(t.date)}</p>
              <p class="text-xs text-muted-foreground">{t.expand?.course?.name ?? "-"}</p>
            </button>
          {/each}
        </div>
      </CardContent>
    </Card>
  {:else}
    <Card>
      <CardContent class="pt-6">
        <p class="text-muted-foreground">No tournaments found for season {selectedSeason}.</p>
      </CardContent>
    </Card>
  {/if}
</div>
