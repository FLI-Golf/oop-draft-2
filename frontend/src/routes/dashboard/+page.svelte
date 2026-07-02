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
  export let form;

  $: tournaments = data.tournaments ?? [];
  $: groups = data.groups ?? [];
  $: selectedTournament = data.selectedTournament;
  $: tournamentSettings = data.tournamentSettings;
  $: selectedSeason = data.selectedSeason;
  $: selectedTournamentId = data.selectedTournamentId;
  $: standings = data.standings ?? [];
  $: samplePayload = data.samplePayload;
  $: tournamentResultsPayload = data.tournamentResultsPayload ?? [];
  $: actionError = form?.error;
  $: actionMessage = form?.message;
  $: totalPayout = standings.reduce((sum, s) => sum + (s.prizeAmount ?? 0), 0);
  let showPlacementPayouts = true;

  function logSamplePayload() {
    if (!samplePayload) return;
    console.log("Tournament results payload", samplePayload);
  }

  function logTournamentResultsCreatePayload() {
    if (!tournamentResultsPayload.length) return;
    console.log("tournament_results create payload", tournamentResultsPayload);
  }

  async function copyTournamentResultsPayload() {
    if (!tournamentResultsPayload.length || !navigator?.clipboard) return;
    await navigator.clipboard.writeText(JSON.stringify(tournamentResultsPayload, null, 2));
  }

  function ordinal(position: number): string {
    if (position === 1) return "1st";
    if (position === 2) return "2nd";
    if (position === 3) return "3rd";
    return `${position}th`;
  }

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
      <div class="flex flex-wrap items-end gap-4">
        <div class="space-y-1">
          <label class="text-xs text-muted-foreground" for="season">Season</label>
          <select
            id="season"
            class="rounded-md border px-3 py-2 text-sm"
            value={selectedSeason}
            on:change={handleSeasonChange}
          >
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

        <form method="POST" action="?/seedTemporaryScores" class="flex gap-2">
          <input type="hidden" name="season" value={selectedSeason} />
          <input type="hidden" name="tournamentId" value={selectedTournamentId ?? ""} />
          <Button type="submit" variant="default" disabled={!selectedTournamentId}>
            Seed Temp Scores
          </Button>
        </form>

        <form method="POST" action="?/clearTournamentScores" class="flex gap-2">
          <input type="hidden" name="season" value={selectedSeason} />
          <input type="hidden" name="tournamentId" value={selectedTournamentId ?? ""} />
          <Button type="submit" variant="outline" disabled={!selectedTournamentId}>
            Clear Scores
          </Button>
        </form>
      </div>

      {#if actionMessage}
        <p class="mt-3 text-sm text-emerald-700">{actionMessage}</p>
      {/if}
      {#if actionError}
        <p class="mt-3 text-sm text-red-700">{actionError}</p>
      {/if}
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

    <!-- Order of Finish -->
    <Card>
      <CardHeader>
        <CardTitle>Order of Finish</CardTitle>
        <p class="text-sm text-muted-foreground">
          Team standings from current scores for {selectedTournament.name}
        </p>
      </CardHeader>
      <CardContent class="space-y-3">
        <div class="flex items-center justify-between">
          <p class="text-sm text-muted-foreground">
            {standings.length > 0
              ? `${standings.length} teams ranked`
              : "No scores saved yet. Seed temp scores or enter live scores to rank teams."}
          </p>
          <Button variant="secondary" on:click={logSamplePayload} disabled={!samplePayload}>
            Log Sample Payload
          </Button>
        </div>

        {#if standings.length > 0}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead class="w-20">Pos</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Players</TableHead>
                <TableHead class="w-24">Score</TableHead>
                <TableHead class="w-32">Prize</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {#each standings as s}
                <TableRow>
                  <TableCell class="font-medium">#{s.position}</TableCell>
                  <TableCell>{s.teamName}</TableCell>
                  <TableCell>
                    <div class="text-xs text-muted-foreground">
                      {s.malePlayerName} / {s.femalePlayerName}
                    </div>
                  </TableCell>
                  <TableCell>{s.totalScore}</TableCell>
                  <TableCell>${s.prizeAmount.toLocaleString()}</TableCell>
                </TableRow>
              {/each}
            </TableBody>
          </Table>
        {/if}
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Placement Payouts</CardTitle>
        <p class="text-sm text-muted-foreground">View a breakdown for each payout per tournament position</p>
      </CardHeader>
      <CardContent class="space-y-3">
        <button
          type="button"
          class="text-sm text-muted-foreground underline"
          on:click={() => (showPlacementPayouts = !showPlacementPayouts)}
        >
          {showPlacementPayouts ? "▲ hide" : "▼ show"}
        </button>

        {#if showPlacementPayouts}
          {#if standings.length > 0}
            <div class="space-y-2">
              {#each standings as s}
                <div class="flex items-start justify-between gap-4 rounded-md border p-3">
                  <div>
                    <div class="font-medium">
                      {#if s.position === 1}
                        🥇 {ordinal(s.position)}
                      {:else if s.position === 2}
                        🥈 {ordinal(s.position)}
                      {:else if s.position === 3}
                        🥉 {ordinal(s.position)}
                      {:else}
                        {ordinal(s.position)}
                      {/if}
                    </div>
                    <div>{s.teamName}</div>
                  </div>
                  <div class="font-semibold">${s.prizeAmount.toLocaleString()}</div>
                </div>
              {/each}
            </div>

            <div class="flex items-center justify-between rounded-md border bg-muted/30 p-3">
              <span class="font-medium">Total</span>
              <span class="text-lg font-bold">${totalPayout.toLocaleString()}</span>
            </div>
          {:else}
            <p class="text-sm text-muted-foreground">No standings yet. Seed or enter scores to generate payouts.</p>
          {/if}
        {/if}
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>tournament_results Create Payload</CardTitle>
        <p class="text-sm text-muted-foreground">
          Generated records matching POST /api/collections/tournament_results/records body fields.
        </p>
      </CardHeader>
      <CardContent class="space-y-3">
        <div class="flex flex-wrap items-center gap-2">
          <Button variant="secondary" on:click={logTournamentResultsCreatePayload} disabled={!tournamentResultsPayload.length}>
            Log Payload (Client)
          </Button>
          <Button variant="outline" on:click={copyTournamentResultsPayload} disabled={!tournamentResultsPayload.length}>
            Copy Payload JSON
          </Button>
          <p class="text-sm text-muted-foreground">
            {tournamentResultsPayload.length > 0
              ? `${tournamentResultsPayload.length} records (${Math.round(tournamentResultsPayload.length / 2)} teams x 2 pros)`
              : "No payload yet. Seed or enter scores first."}
          </p>
        </div>

        {#if tournamentResultsPayload.length > 0}
          <pre class="max-h-[360px] overflow-auto rounded-md border bg-muted/30 p-3 text-xs">{JSON.stringify(tournamentResultsPayload, null, 2)}</pre>
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
