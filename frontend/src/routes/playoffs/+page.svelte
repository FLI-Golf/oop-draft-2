<script lang="ts">
  import { goto, invalidateAll } from "$app/navigation";
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
  $: playoffs = data.playoffs ?? [];
  $: playoffTeams = data.playoffTeams ?? [];
  $: playoffThrows = data.playoffThrows ?? [];
  $: selectedPlayoff = data.selectedPlayoff;
  $: teamStandings = data.teamStandings ?? [];
  $: selectedSeason = data.selectedSeason;
  $: selectedTournamentId = data.selectedTournamentId;

  // Local state for creating playoff
  let selectedTiedTeams: string[] = [];
  let playoffPosition = 1;

  // Local state for throw distances
  let throwDistances: Map<string, number> = new Map();

  // Initialize throw distances from server data
  $: {
    if (playoffThrows.length > 0) {
      throwDistances = new Map(playoffThrows.map(t => [`${t.team}-${t.player}`, t.distanceFeet]));
    }
  }

  // Find ties in standings
  $: tiedPositions = findTies(teamStandings);

  function findTies(standings: typeof teamStandings): Map<number, typeof teamStandings> {
    const ties = new Map<number, typeof teamStandings>();
    let position = 1;
    let i = 0;
    
    while (i < standings.length) {
      const currentScore = standings[i].totalScore;
      const tiedTeams = standings.filter(t => t.totalScore === currentScore);
      
      if (tiedTeams.length > 1) {
        ties.set(position, tiedTeams);
      }
      
      i += tiedTeams.length;
      position += tiedTeams.length;
    }
    
    return ties;
  }

  function formatScore(score: number): string {
    if (score === 0) return "E";
    if (score > 0) return `+${score}`;
    return String(score);
  }

  function handleSeasonChange(event: Event) {
    const season = (event.target as HTMLSelectElement).value;
    goto(`/playoffs?season=${season}`);
  }

  function handleTournamentChange(event: Event) {
    const tournamentId = (event.target as HTMLSelectElement).value;
    goto(`/playoffs?season=${selectedSeason}&tournament=${tournamentId}`);
  }

  function selectPlayoff(playoffId: string) {
    goto(`/playoffs?season=${selectedSeason}&tournament=${selectedTournamentId}&playoff=${playoffId}`);
  }

  function toggleTeamSelection(teamId: string) {
    if (selectedTiedTeams.includes(teamId)) {
      selectedTiedTeams = selectedTiedTeams.filter(id => id !== teamId);
    } else {
      selectedTiedTeams = [...selectedTiedTeams, teamId];
    }
  }

  async function createPlayoff(position: number, tiedScore: number) {
    const formData = new FormData();
    formData.append("tournamentId", selectedTournamentId);
    formData.append("forPosition", String(position));
    formData.append("tiedTeamIds", selectedTiedTeams.join(","));
    formData.append("tiedScore", String(tiedScore));

    const response = await fetch("?/createPlayoff", {
      method: "POST",
      body: formData
    });

    if (response.ok) {
      selectedTiedTeams = [];
      await invalidateAll();
    }
  }

  function getThrowDistance(teamId: string, playerId: string): number {
    return throwDistances.get(`${teamId}-${playerId}`) ?? 0;
  }

  function setThrowDistance(teamId: string, playerId: string, distance: number) {
    throwDistances.set(`${teamId}-${playerId}`, distance);
    throwDistances = throwDistances;
  }

  async function saveThrow(teamId: string, playerId: string, throwOrder: number) {
    const distance = getThrowDistance(teamId, playerId);
    
    const formData = new FormData();
    formData.append("playoffId", selectedPlayoff?.id ?? "");
    formData.append("teamId", teamId);
    formData.append("playerId", playerId);
    formData.append("distanceFeet", String(distance));
    formData.append("throwOrder", String(throwOrder));

    await fetch("?/saveThrow", {
      method: "POST",
      body: formData
    });

    await invalidateAll();
  }

  async function completePlayoff() {
    const formData = new FormData();
    formData.append("playoffId", selectedPlayoff?.id ?? "");

    await fetch("?/completePlayoff", {
      method: "POST",
      body: formData
    });

    await invalidateAll();
  }

  // Calculate team totals for playoff
  function getTeamTotalDistance(teamId: string): number {
    let total = 0;
    for (const [key, distance] of throwDistances) {
      if (key.startsWith(teamId)) {
        total += distance;
      }
    }
    return total;
  }

  // Check if all throws are entered
  $: allThrowsEntered = playoffTeams.length > 0 && playoffTeams.every(pt => {
    const team = pt.expand?.team;
    if (!team) return false;
    const maleThrow = throwDistances.has(`${team.id}-${team.malePlayer}`);
    const femaleThrow = throwDistances.has(`${team.id}-${team.femalePlayer}`);
    return maleThrow && femaleThrow;
  });
</script>

<div class="p-6 max-w-5xl mx-auto space-y-6">
  <div class="flex items-start justify-between">
    <div class="space-y-1">
      <h1 class="text-3xl font-bold">Playoffs</h1>
      <p class="text-muted-foreground">Closest-to-hole tiebreakers</p>
    </div>

    <Button variant="outline" asChild>
      <a href="/dashboard">← Back to Dashboard</a>
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
              <option value={t.id}>{t.name}</option>
            {/each}
          </select>
        </div>
      </div>
    </CardContent>
  </Card>

  {#if !selectedPlayoff}
    <!-- Tournament Standings -->
    <Card>
      <CardHeader>
        <CardTitle>Tournament Standings</CardTitle>
        <p class="text-sm text-muted-foreground">Teams tied for a position can enter a playoff</p>
      </CardHeader>
      <CardContent>
        {#if teamStandings.length === 0}
          <p class="text-muted-foreground">No scores recorded yet.</p>
        {:else}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead class="w-16">Pos</TableHead>
                <TableHead>Team</TableHead>
                <TableHead class="text-right">Score</TableHead>
                <TableHead class="w-24">Tied</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {#each teamStandings as standing, i}
                {@const position = teamStandings.filter((s, j) => j < i && s.totalScore < standing.totalScore).length + 1}
                {@const isTied = teamStandings.filter(s => s.totalScore === standing.totalScore).length > 1}
                <TableRow>
                  <TableCell class="font-medium">{position}</TableCell>
                  <TableCell>{standing.team.name}</TableCell>
                  <TableCell class="text-right font-mono">{formatScore(standing.totalScore)}</TableCell>
                  <TableCell>
                    {#if isTied}
                      <span class="text-xs px-2 py-1 rounded bg-amber-100 text-amber-700">Tied</span>
                    {/if}
                  </TableCell>
                </TableRow>
              {/each}
            </TableBody>
          </Table>
        {/if}
      </CardContent>
    </Card>

    <!-- Existing Playoffs -->
    {#if playoffs.length > 0}
      <Card>
        <CardHeader>
          <CardTitle>Playoffs</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="grid gap-3 sm:grid-cols-2">
            {#each playoffs as playoff}
              <button
                class="rounded-lg border p-4 text-left transition hover:bg-muted/50"
                on:click={() => selectPlayoff(playoff.id)}
              >
                <div class="flex items-center justify-between">
                  <span class="font-semibold">Position {playoff.forPosition} Playoff</span>
                  <span class="text-xs px-2 py-1 rounded border {playoff.status === 'complete' ? 'bg-emerald-100 text-emerald-700' : playoff.status === 'in_progress' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'}">
                    {playoff.status === 'complete' ? 'Complete' : playoff.status === 'in_progress' ? 'In Progress' : 'Pending'}
                  </span>
                </div>
                {#if playoff.status === 'complete' && playoff.expand?.winner}
                  <p class="text-sm text-emerald-600 mt-2">Winner: {playoff.expand.winner.name}</p>
                {/if}
              </button>
            {/each}
          </div>
        </CardContent>
      </Card>
    {/if}

    <!-- Create Playoff for Ties -->
    {#if tiedPositions.size > 0}
      <Card>
        <CardHeader>
          <CardTitle>Create Playoff</CardTitle>
          <p class="text-sm text-muted-foreground">Select tied teams to start a closest-to-hole playoff</p>
        </CardHeader>
        <CardContent class="space-y-4">
          {#each [...tiedPositions] as [position, tiedTeams]}
            <div class="rounded-lg border p-4">
              <h3 class="font-semibold mb-2">Position {position} - Tied at {formatScore(tiedTeams[0].totalScore)}</h3>
              <div class="flex flex-wrap gap-2 mb-3">
                {#each tiedTeams as standing}
                  <button
                    class="px-3 py-1.5 rounded-md border text-sm transition {selectedTiedTeams.includes(standing.team.id) ? 'bg-emerald-100 border-emerald-500 text-emerald-700' : 'hover:bg-muted/50'}"
                    on:click={() => toggleTeamSelection(standing.team.id)}
                  >
                    {standing.team.name}
                  </button>
                {/each}
              </div>
              {#if selectedTiedTeams.length >= 2 && tiedTeams.some(t => selectedTiedTeams.includes(t.team.id))}
                <Button 
                  size="sm"
                  on:click={() => createPlayoff(position, tiedTeams[0].totalScore)}
                >
                  Start Playoff ({selectedTiedTeams.length} teams)
                </Button>
              {/if}
            </div>
          {/each}
        </CardContent>
      </Card>
    {/if}

  {:else}
    <!-- Playoff Scoring Interface -->
    <Card>
      <CardHeader>
        <div class="flex items-center justify-between">
          <div>
            <CardTitle>Position {selectedPlayoff.forPosition} Playoff</CardTitle>
            <p class="text-sm text-muted-foreground">Closest-to-hole competition - lowest total distance wins</p>
          </div>
          <Button variant="outline" size="sm" on:click={() => goto(`/playoffs?season=${selectedSeason}&tournament=${selectedTournamentId}`)}>
            ← Back to Playoffs
          </Button>
        </div>
      </CardHeader>
      <CardContent class="space-y-6">
        {#if selectedPlayoff.status === 'complete'}
          <div class="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-center">
            <p class="text-emerald-700 font-semibold">Playoff Complete!</p>
            <p class="text-emerald-600 text-lg mt-1">Winner: {selectedPlayoff.expand?.winner?.name ?? 'Unknown'}</p>
          </div>
        {/if}

        <!-- Teams and Throws -->
        {#each playoffTeams as pt}
          {@const team = pt.expand?.team}
          {#if team}
            {@const teamTotal = getTeamTotalDistance(team.id)}
            <div class="rounded-lg border p-4 space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="font-semibold text-lg">{team.name}</h3>
                <div class="text-right">
                  <p class="text-sm text-muted-foreground">Total Distance</p>
                  <p class="text-xl font-bold">{teamTotal.toFixed(1)} ft</p>
                </div>
              </div>

              <div class="grid gap-4 sm:grid-cols-2">
                <!-- Male Player -->
                {#if team.expand?.malePlayer}
                  {@const player = team.expand.malePlayer}
                  {@const distance = getThrowDistance(team.id, player.id)}
                  <div class="rounded-md border p-3 space-y-2">
                    <div>
                      <p class="font-medium">{player.name}</p>
                      <p class="text-xs text-muted-foreground">Male</p>
                    </div>
                    <div class="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="500"
                        class="w-24 rounded-md border px-3 py-2 text-sm"
                        value={distance}
                        on:input={(e) => setThrowDistance(team.id, player.id, Number(e.currentTarget.value))}
                        disabled={selectedPlayoff.status === 'complete'}
                      />
                      <span class="text-sm text-muted-foreground">feet</span>
                      {#if selectedPlayoff.status !== 'complete'}
                        <Button size="sm" variant="outline" on:click={() => saveThrow(team.id, player.id, 1)}>
                          Save
                        </Button>
                      {/if}
                    </div>
                  </div>
                {/if}

                <!-- Female Player -->
                {#if team.expand?.femalePlayer}
                  {@const player = team.expand.femalePlayer}
                  {@const distance = getThrowDistance(team.id, player.id)}
                  <div class="rounded-md border p-3 space-y-2">
                    <div>
                      <p class="font-medium">{player.name}</p>
                      <p class="text-xs text-muted-foreground">Female</p>
                    </div>
                    <div class="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="500"
                        class="w-24 rounded-md border px-3 py-2 text-sm"
                        value={distance}
                        on:input={(e) => setThrowDistance(team.id, player.id, Number(e.currentTarget.value))}
                        disabled={selectedPlayoff.status === 'complete'}
                      />
                      <span class="text-sm text-muted-foreground">feet</span>
                      {#if selectedPlayoff.status !== 'complete'}
                        <Button size="sm" variant="outline" on:click={() => saveThrow(team.id, player.id, 2)}>
                          Save
                        </Button>
                      {/if}
                    </div>
                  </div>
                {/if}
              </div>
            </div>
          {/if}
        {/each}

        <!-- Complete Playoff Button -->
        {#if selectedPlayoff.status !== 'complete' && allThrowsEntered}
          <Button class="w-full" on:click={completePlayoff}>
            Complete Playoff & Determine Winner
          </Button>
        {/if}
      </CardContent>
    </Card>
  {/if}
</div>
