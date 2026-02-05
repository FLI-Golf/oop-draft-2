<script lang="ts">
  import { goto, invalidateAll } from "$app/navigation";
  import { enhance } from "$app/forms";
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";

  export let data;

  $: tournaments = data.tournaments ?? [];
  $: groups = data.groups ?? [];
  $: selectedGroup = data.selectedGroup;
  $: scores = data.scores ?? [];
  $: players = data.players ?? [];
  $: selectedSeason = data.selectedSeason;
  $: selectedTournamentId = data.selectedTournamentId;
  $: selectedGroupId = data.selectedGroupId;
  $: courseData = data.courseData;

  // Scoring state
  let currentHole = 1;
  let saving = false;

  // Build scores map for quick lookup: playerId-hole -> score
  $: scoresMap = new Map(scores.map(s => [`${s.player}-${s.hole}`, s.score]));

  // Local scores for current session (before saving)
  let localScores: Map<string, number> = new Map();

  // Initialize local scores from server data
  $: {
    if (scores.length > 0) {
      localScores = new Map(scores.map(s => [`${s.player}-${s.hole}`, s.score]));
    }
  }

  // Get score for a specific player on current hole
  function getPlayerScore(playerId: string): number {
    return localScores.get(`${playerId}-${currentHole}`) ?? 0;
  }

  // Get distance for current hole
  function getHoleDistance(): number | null {
    if (!courseData?.baseHoleDistances || courseData.baseHoleDistances.length === 0) {
      return null;
    }
    // For holes 1-9: use index 0-8
    // For holes 10-18: use index 0-8 (same physical holes)
    const courseHoleIndex = currentHole <= 9 ? currentHole - 1 : currentHole - 10;
    return courseData.baseHoleDistances[courseHoleIndex] ?? null;
  }

  // Total holes (9-hole course played twice: front 1-9, back 10-18)
  $: totalHoles = 18;
  
  // Determine if we're on front nine or back nine
  $: isFrontNine = currentHole <= 9;
  $: displayHole = currentHole; // 1-18
  $: courseHole = currentHole <= 9 ? currentHole : currentHole - 9; // 1-9 (physical hole on course)

  // Check if all scores are entered (18 holes)
  $: allScoresEntered = players.length > 0 && 
    players.every(p => 
      Array.from({ length: 18 }, (_, i) => i + 1).every(hole => 
        localScores.has(`${p.id}-${hole}`)
      )
    );

  function formatTeeTime(time: string): string {
    if (!time) return "-";
    const [hours, minutes] = time.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${String(minutes).padStart(2, "0")} ${period}`;
  }

  function formatScore(score: number): string {
    if (score === 0) return "E";
    if (score > 0) return `+${score}`;
    return String(score);
  }

  function adjustScore(playerId: string, delta: number) {
    const key = `${playerId}-${currentHole}`;
    const current = localScores.get(key) ?? 0;
    const newScore = Math.max(-3, Math.min(10, current + delta));
    localScores.set(key, newScore);
    localScores = localScores; // trigger reactivity
  }

  async function saveHoleScores() {
    if (!selectedGroupId || players.length === 0) return;
    
    saving = true;
    
    try {
      // Save all 4 players' scores for current hole
      for (const player of players) {
        const score = localScores.get(`${player.id}-${currentHole}`) ?? 0;
        
        const formData = new FormData();
        formData.append("groupId", selectedGroupId);
        formData.append("playerId", player.id);
        formData.append("hole", String(currentHole));
        formData.append("score", String(score));

        await fetch("?/saveScore", {
          method: "POST",
          body: formData
        });
      }
      
      // Move to next hole
      nextHole();
    } finally {
      saving = false;
    }
  }

  function nextHole() {
    if (currentHole < 18) {
      currentHole++;
    }
  }

  function prevHole() {
    if (currentHole > 1) {
      currentHole--;
    }
  }

  function goToHole(hole: number) {
    currentHole = hole;
  }

  async function updateStatus(status: string) {
    if (!selectedGroupId) return;
    
    const formData = new FormData();
    formData.append("groupId", selectedGroupId);
    formData.append("status", status);

    await fetch("?/updateGroupStatus", {
      method: "POST",
      body: formData
    });
    
    await invalidateAll();
  }

  function handleSeasonChange(event: Event) {
    const season = (event.target as HTMLSelectElement).value;
    goto(`/scoring?season=${season}`);
  }

  function handleTournamentChange(event: Event) {
    const tournamentId = (event.target as HTMLSelectElement).value;
    goto(`/scoring?season=${selectedSeason}&tournament=${tournamentId}`);
  }

  function selectGroup(groupId: string) {
    console.log("selectGroup called:", groupId, selectedSeason, selectedTournamentId);
    const url = `/scoring?season=${selectedSeason}&tournament=${selectedTournamentId}&group=${groupId}`;
    console.log("Navigating to:", url);
    goto(url);
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case "complete": return "bg-emerald-100 text-emerald-700 border-emerald-300";
      case "in_progress": return "bg-amber-100 text-amber-700 border-amber-300";
      default: return "bg-gray-100 text-gray-700 border-gray-300";
    }
  }

  function getStatusLabel(status: string): string {
    switch (status) {
      case "complete": return "Complete";
      case "in_progress": return "In Progress";
      default: return "Pending";
    }
  }

  // Calculate player total for display (18 holes)
  function getPlayerTotal(playerId: string): number {
    let total = 0;
    for (let h = 1; h <= 18; h++) {
      const score = localScores.get(`${playerId}-${h}`);
      if (score !== undefined) total += score;
    }
    return total;
  }
</script>

<div class="p-6 max-w-4xl mx-auto space-y-6">
  <div class="flex items-start justify-between">
    <div class="space-y-1">
      <h1 class="text-3xl font-bold">Live Scoring</h1>
      <p class="text-muted-foreground">Enter scores hole-by-hole for each player</p>
    </div>

    <a href="/tournaments" class="px-4 py-2 border rounded-md inline-block hover:bg-gray-100 transition">← Back to Admin</a>
  </div>

  <!-- Filters -->
  {#if !selectedGroupId}
    <Card>
      <CardContent class="pt-6">
        <div class="flex flex-wrap gap-4">
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground" for="season">Season</label>
            <select
              id="season"
              class="rounded-md border px-3 py-2 text-sm"
              value={selectedSeason}
              onchange={handleSeasonChange}
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
              onchange={handleTournamentChange}
            >
              {#each tournaments as t}
                <option value={t.id}>{t.name}</option>
              {/each}
            </select>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Group Selection -->
    <Card>
      <CardHeader>
        <CardTitle>Select Group to Score</CardTitle>
      </CardHeader>
      <CardContent>
        {#if groups.length === 0}
          <p class="text-muted-foreground">No groups found. Generate groups first.</p>
        {:else}
          <div class="grid gap-3 sm:grid-cols-2">
            {#each groups as group}
              <a
                href="/scoring?season={selectedSeason}&tournament={selectedTournamentId}&group={group.id}"
                class="rounded-lg border p-4 text-left transition hover:bg-muted/50 block"
              >
                <div class="flex items-center justify-between">
                  <span class="font-semibold">Group {group.groupNumber}</span>
                  <span class="text-xs px-2 py-1 rounded border {getStatusColor(group.status || 'pending')}">
                    {getStatusLabel(group.status || 'pending')}
                  </span>
                </div>
                <p class="text-sm text-muted-foreground mt-1">
                  {formatTeeTime(group.teeTime)} - Hole {group.startingHole}
                </p>
                <p class="text-sm mt-2">
                  {group.expand?.team1?.name ?? "Team 1"} vs {group.expand?.team2?.name ?? "Team 2"}
                </p>
              </a>
            {/each}
          </div>
        {/if}
      </CardContent>
    </Card>
  {:else if selectedGroup}
    <!-- Scoring Interface -->
    <Card>
      <CardHeader>
        <div class="flex items-center justify-between">
          <div>
            <CardTitle>Group {selectedGroup.groupNumber}</CardTitle>
            <p class="text-sm text-muted-foreground">
              {selectedGroup.expand?.team1?.name} vs {selectedGroup.expand?.team2?.name}
            </p>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs px-2 py-1 rounded border {getStatusColor(selectedGroup.status || 'pending')}">
              {getStatusLabel(selectedGroup.status || 'pending')}
            </span>
            <button 
              class="px-3 py-2 border rounded-md text-sm hover:bg-gray-100 transition"
              onclick={() => goto(`/scoring?season=${selectedSeason}&tournament=${selectedTournamentId}`)}
            >
              Change Group
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent class="space-y-6">
        <!-- Hole Progress -->
        <div class="space-y-3">
          <div class="flex justify-between text-sm">
            <span>Round Progress</span>
            <span>{currentHole} / {totalHoles}</span>
          </div>
          
          <!-- Front Nine -->
          <div class="space-y-1">
            <p class="text-xs text-muted-foreground font-medium">Front 9 (Holes 1-9)</p>
            <div class="flex gap-1">
              {#each Array.from({ length: 9 }, (_, i) => i + 1) as hole}
                <button
                  class="flex-1 h-3 rounded-full transition-colors text-[10px] flex items-center justify-center {hole < currentHole ? 'bg-emerald-500 text-white' : hole === currentHole ? 'bg-emerald-300' : 'bg-gray-200'}"
                  title="{courseData?.baseHoleDistances ? courseData.baseHoleDistances[hole - 1] + ' yards' : 'Hole ' + hole}"
                  onclick={() => goToHole(hole)}
                >
                  {hole}
                </button>
              {/each}
            </div>
          </div>
          
          <!-- Back Nine -->
          <div class="space-y-1">
            <p class="text-xs text-muted-foreground font-medium">Back 9 (Holes 10-18)</p>
            <div class="flex gap-1">
              {#each Array.from({ length: 9 }, (_, i) => i + 10) as hole}
                <button
                  class="flex-1 h-3 rounded-full transition-colors text-[10px] flex items-center justify-center {hole < currentHole ? 'bg-emerald-500 text-white' : hole === currentHole ? 'bg-emerald-300' : 'bg-gray-200'}"
                  title="{courseData?.baseHoleDistances ? courseData.baseHoleDistances[hole - 10] + ' yards' : 'Hole ' + hole}"
                  onclick={() => goToHole(hole)}
                >
                  {hole}
                </button>
              {/each}
            </div>
          </div>
        </div>

        <!-- Current Hole Header -->
        <div class="text-center">
          <p class="text-sm text-muted-foreground">{isFrontNine ? 'Front 9' : 'Back 9'} - Course Hole {courseHole}</p>
          <h2 class="text-3xl font-bold">Hole {displayHole}</h2>
          {#if getHoleDistance() !== null}
            <p class="text-lg font-semibold text-emerald-600">{getHoleDistance()} yards</p>
          {/if}
          <p class="text-sm text-muted-foreground">Enter scores for all players</p>
        </div>

        <!-- All Players Scoring -->
        <div class="grid gap-4 sm:grid-cols-2">
          {#each players as player}
            {@const playerScore = getPlayerScore(player.id)}
            <div class="rounded-lg border p-4 space-y-3">
              <div class="text-center">
                <h3 class="font-semibold">{player.name}</h3>
                <p class="text-xs text-muted-foreground capitalize">{player.gender}</p>
              </div>

              <!-- Score Controls -->
              <div class="flex items-center justify-center gap-4">
                <button 
                  class="bg-white hover:bg-gray-100 w-12 h-12 text-xl border rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition"
                  onclick={() => adjustScore(player.id, -1)}
                  disabled={playerScore <= -3}
                >
                  −
                </button>
                
                <div class="w-16 h-16 flex items-center justify-center rounded-full border-4 border-gray-300 bg-white">
                  <span class="text-2xl font-bold">{formatScore(playerScore)}</span>
                </div>
                
                <button 
                  class="bg-white hover:bg-gray-100 w-12 h-12 text-xl border rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition"
                  onclick={() => adjustScore(player.id, 1)}
                  disabled={playerScore >= 10}
                >
                  +
                </button>
              </div>

              <p class="text-xs text-center text-muted-foreground">
                {playerScore === 0 ? "Par" : playerScore < 0 ? `${Math.abs(playerScore)} under` : `${playerScore} over`}
              </p>
            </div>
          {/each}
        </div>

        <!-- Navigation -->
        <div class="flex justify-between pt-4">
          <button 
            class="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition"
            onclick={prevHole}
            disabled={currentHole === 1}
          >
            ← Hole {currentHole - 1}
          </button>
          
          <button 
            class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition"
            onclick={saveHoleScores}
            disabled={saving}
          >
            {saving ? "Saving..." : currentHole === 18 ? "Save & Finish" : `Save & Hole ${currentHole + 1} →`}
          </button>
        </div>

        <!-- Scorecard Summary -->
        <div class="pt-6 border-t">
          <h3 class="font-semibold mb-3">Scorecard</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b bg-gray-50">
                  <th class="text-left py-2 pr-4 sticky left-0 bg-gray-50">Player</th>
                  <th colspan="9" class="text-center py-1 text-xs text-muted-foreground border-r">Front 9</th>
                  <th colspan="9" class="text-center py-1 text-xs text-muted-foreground">Back 9</th>
                  <th class="text-center px-2 py-2 font-bold">Tot</th>
                </tr>
                <tr class="border-b">
                  <th class="text-left py-2 pr-4 sticky left-0 bg-white"></th>
                  {#each Array.from({ length: 9 }, (_, i) => i + 1) as hole}
                    <th class="text-center px-1 py-1 min-w-[32px] text-xs {hole === 9 ? 'border-r' : ''}">{hole}</th>
                  {/each}
                  {#each Array.from({ length: 9 }, (_, i) => i + 10) as hole}
                    <th class="text-center px-1 py-1 min-w-[32px] text-xs">{hole}</th>
                  {/each}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {#each players as player}
                  <tr class="border-b">
                    <td class="py-2 pr-2 font-medium text-xs sticky left-0 bg-white">{player.name.split(' ')[0]}</td>
                    {#each Array.from({ length: 18 }, (_, i) => i + 1) as hole}
                      {@const scoreKey = `${player.id}-${hole}`}
                      {@const score = localScores.get(scoreKey)}
                      {@const isCurrentHole = currentHole === hole}
                      <td 
                        class="text-center px-1 py-1 cursor-pointer hover:bg-muted/50 rounded text-xs {isCurrentHole ? 'bg-emerald-100 font-bold' : ''} {hole === 9 ? 'border-r' : ''}"
                        onclick={() => goToHole(hole)}
                      >
                        {score !== undefined ? formatScore(score) : "-"}
                      </td>
                    {/each}
                    <td class="text-center px-2 py-2 font-bold text-sm">
                      {formatScore(getPlayerTotal(player.id))}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Status Actions -->
        {#if allScoresEntered && selectedGroup.status !== "complete"}
          <div class="pt-4 border-t">
            <button 
              class="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition"
              onclick={() => updateStatus("complete")}
            >
              Mark Group as Complete
            </button>
          </div>
        {:else if selectedGroup.status !== "in_progress" && selectedGroup.status !== "complete"}
          <div class="pt-4 border-t">
            <button 
              class="w-full px-4 py-2 border rounded-md hover:bg-gray-100 transition"
              onclick={() => updateStatus("in_progress")}
            >
              Start Scoring (Mark In Progress)
            </button>
          </div>
        {/if}
      </CardContent>
    </Card>
  {/if}
</div>
