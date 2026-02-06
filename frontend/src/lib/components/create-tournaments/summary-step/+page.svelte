<script lang="ts">
  /**
   * Summary Step - Configuration complete
   * Step 4 of tournament setup wizard
   */
  
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  
  type TournamentRecord = {
    id: string;
    name: string;
    date: string;
  };
  
  export let summary: {
    season: string;
    prizePool: number;
    courseName: string;
    tournamentsCreated: number;
    totalTournaments: number;
  };
  
  export let tournaments: TournamentRecord[] = [];
  
  $: prizePoolDisplay = summary.prizePool 
    ? `$${(summary.prizePool / 1000000).toFixed(0)}M` 
    : 'Not set';
</script>

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
      <h3 class="text-lg font-semibold text-emerald-900 mb-4">
        ✅ Season Setup Complete
      </h3>
      <div class="grid gap-3 sm:grid-cols-2">
        <div>
          <span class="text-sm text-emerald-700 font-medium">Prize Pool</span>
          <p class="text-lg font-bold text-emerald-900">{prizePoolDisplay}</p>
        </div>
        <div>
          <span class="text-sm text-emerald-700 font-medium">Course</span>
          <p class="text-lg font-bold text-emerald-900">
            {summary.courseName || 'FLI Stadium'}
          </p>
        </div>
        <div>
          <span class="text-sm text-emerald-700 font-medium">Tournaments Created</span>
          <p class="text-lg font-bold text-emerald-900">
            {summary.tournamentsCreated}
          </p>
        </div>
        <div>
          <span class="text-sm text-emerald-700 font-medium">Season</span>
          <p class="text-lg font-bold text-emerald-900">{summary.season}</p>
        </div>
      </div>
    </div>

    <!-- Default Settings -->
    <div class="rounded-lg border border-emerald-500 bg-emerald-50 p-4">
      <h4 class="font-semibold text-emerald-700 mb-2">
        Default Tournament Settings
      </h4>
      <ul class="space-y-2 text-sm text-emerald-700">
        <li>✓ Starting hole: 1</li>
        <li>✓ Group intervals: 10 minutes</li>
        <li>✓ First tee time: 8:00 AM</li>
        <li>✓ Format: Stroke play</li>
      </ul>
      <p class="text-xs text-emerald-600 mt-3 italic">
        Click the ⚙️ icon on any tournament to customize these settings
      </p>
    </div>

    <!-- Configure Individual Tournaments -->
    {#if tournaments.length > 0}
      <div>
        <h4 class="text-sm font-medium mb-3">Configure Individual Tournaments</h4>
        <div class="grid gap-2">
          {#each tournaments as t}
            <a
              href={`/tournaments/${t.id}/settings`}
              class="flex items-center justify-between p-3 rounded-md border 
                hover:bg-gray-50 transition"
            >
              <div>
                <span class="font-medium">{t.name}</span>
                <span class="text-sm text-muted-foreground ml-2">
                  ({new Date(t.date).toDateString()})
                </span>
              </div>
              <span class="text-muted-foreground">⚙️ Settings</span>
            </a>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Step 5 & 6 Previews -->
    <div class="grid gap-4 sm:grid-cols-2">
      <div class="rounded-lg border p-4 bg-white">
        <h4 class="font-semibold text-gray-900 mb-2">
          Step 5: Create Groups (Preview)
        </h4>
        <p class="text-sm text-muted-foreground">
          Generate player groups and tee times for each tournament. You can review 
          and adjust groups before live scoring begins.
        </p>
        <div class="mt-3">
          <a href="/tournaments" class="inline-flex">
            <Button size="sm">Open Tournaments</Button>
          </a>
        </div>
      </div>

      <div class="rounded-lg border p-4 bg-white">
        <h4 class="font-semibold text-gray-900 mb-2">
          Step 6: View Dashboard & Manage (Preview)
        </h4>
        <p class="text-sm text-muted-foreground">
          Use the Displays hub to access dashboards, live scoring, league standings, 
          and tournament management tools.
        </p>
        <div class="mt-3">
          <a href="/displays" class="inline-flex">
            <Button variant="default" size="sm">Go to Displays</Button>
          </a>
        </div>
      </div>
    </div>
  </CardContent>
</Card>
