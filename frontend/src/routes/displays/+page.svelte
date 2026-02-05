<script lang="ts">
  import { enhance } from "$app/forms";
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";

  export let data;
  export let form;

  let isGenerating = false;
  let selectedSeason = "2026";
  let status = "";
  let error = "";
</script>

<div class="p-6">
  <div class="space-y-6">
    <!-- Status Messages -->
    {#if status}
      <div class="rounded-md bg-emerald-50 p-4 text-emerald-700 border border-emerald-200">
        <p class="font-medium">{status}</p>
      </div>
    {/if}
    {#if error}
      <div class="rounded-md bg-red-50 p-4 text-red-700 border border-red-200">
        <p class="font-medium">{error}</p>
      </div>
    {/if}
    
    <!-- Header -->
    <div class="flex items-start justify-between">
      <div class="space-y-1">
        <h1 class="text-3xl font-bold">Tournament Displays</h1>
        <p class="text-muted-foreground">Access tournament management, live scoring, standings, and dashboards.</p>
      </div>
      <a href="/work-order">
        <Button variant="outline">
          ← Return to Work Order
        </Button>
      </a>
    </div>

    <!-- Main Grid -->
    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <!-- Tournament Dashboard -->
      <Card class="hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader>
          <CardTitle class="text-xl">📊 Tournament Dashboard</CardTitle>
        </CardHeader>
        <CardContent class="space-y-3">
          <p class="text-sm text-muted-foreground">
            View tee sheets, groups, team matchups, tee times, and starting holes for all tournaments.
          </p>
          <a href="/dashboard" class="block">
            <Button class="w-full">
              Open Dashboard
            </Button>
          </a>
        </CardContent>
      </Card>

      <!-- Step 6: Generate Groups -->
      <Card class="hover:shadow-lg transition-shadow border-emerald-300 bg-emerald-50">
        <CardHeader>
          <CardTitle class="text-xl">👥 Step 6: Generate Groups</CardTitle>
          <p class="text-xs text-emerald-700 font-medium mt-1">Setup phase</p>
        </CardHeader>
        <CardContent class="space-y-3">
          <p class="text-sm text-emerald-800">
            Generate player groups and tee times for tournaments. Groups and prize distributions are now created for your season data.
          </p>
          <form
            method="POST"
            action="?/generateGroups"
            use:enhance={() => {
              isGenerating = true;
              return async ({ result, update }) => {
                if (result.type === 'success') {
                  status = (result.data as Record<string, any>)?.message || 'Groups generated successfully!';
                  error = '';
                } else if (result.type === 'failure') {
                  status = '';
                  error = (result.data as Record<string, any>)?.error || 'Failed to generate groups.';
                } else if (result.type === 'error') {
                  status = '';
                  error = (result.error as Record<string, any>)?.message || 'An error occurred.';
                }
                isGenerating = false;
                await update();
              };
            }}
            class="space-y-3"
          >
            <div class="space-y-2">
              <label class="text-xs text-emerald-700 font-medium" for="season-select-groups">
                Select Season
              </label>
              <select
                id="season-select-groups"
                name="season"
                bind:value={selectedSeason}
                class="w-full rounded-md border border-emerald-300 px-3 py-2 text-sm"
              >
                <option value="2026">2026</option>
                <option value="2027">2027</option>
                <option value="2028">2028</option>
                <option value="2029">2029</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={isGenerating}
              class="w-full inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {isGenerating ? 'Generating...' : 'Generate Groups'}
            </button>
          </form>
        </CardContent>
      </Card>

      <!-- Step 7: Live Scoring -->
      <Card class="hover:shadow-lg transition-shadow border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle class="text-xl">🎯 Step 7: Live Scoring</CardTitle>
          <p class="text-xs text-blue-700 font-medium mt-1">Tournament phase</p>
        </CardHeader>
        <CardContent class="space-y-3">
          <p class="text-sm text-blue-800">
            With groups created and data ready, enter scores hole-by-hole during tournaments. Track accuracy and scorecards in real-time.
          </p>
          <a href="/scoring" class="block">
            <Button class="w-full bg-blue-600 hover:bg-blue-700">
              Enter Scores
            </Button>
          </a>
        </CardContent>
      </Card>

      <!-- League Standings -->
      <Card class="hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader>
          <CardTitle class="text-xl">🏆 League Standings</CardTitle>
        </CardHeader>
        <CardContent class="space-y-3">
          <p class="text-sm text-muted-foreground">
            View cumulative team standings, points, and prize earnings across the season.
          </p>
          <a href="/league" class="block">
            <Button class="w-full">
              View Standings
            </Button>
          </a>
        </CardContent>
      </Card>

      <!-- Tournament Management -->
      <Card class="hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader>
          <CardTitle class="text-xl">⚙️ Tournament Management</CardTitle>
        </CardHeader>
        <CardContent class="space-y-3">
          <p class="text-sm text-muted-foreground">
            Create tournaments, configure settings, manage courses, and set up tournaments.
          </p>
          <a href="/tournaments" class="block">
            <Button class="w-full">
              Manage Tournaments
            </Button>
          </a>
        </CardContent>
      </Card>

      <!-- Playoffs -->
      <Card class="hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader>
          <CardTitle class="text-xl">🥊 Playoffs</CardTitle>
        </CardHeader>
        <CardContent class="space-y-3">
          <p class="text-sm text-muted-foreground">
            Manage playoff structure, rounds, and advancement. Generate playoff brackets.
          </p>
          <a href="/playoffs" class="block">
            <Button class="w-full">
              View Playoffs
            </Button>
          </a>
        </CardContent>
      </Card>

      <!-- Work Order -->
      <Card class="hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader>
          <CardTitle class="text-xl">📋 Setup Wizard</CardTitle>
        </CardHeader>
        <CardContent class="space-y-3">
          <p class="text-sm text-muted-foreground">
            Return to the tournament setup wizard to configure seasons, courses, and groups.
          </p>
          <a href="/work-order" class="block">
            <Button class="w-full" variant="outline">
              Back to Setup
            </Button>
          </a>
        </CardContent>
      </Card>
    </div>

    <!-- Quick Stats Section -->
    <Card class="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle>🚀 Tournament Setup Workflow</CardTitle>
      </CardHeader>
      <CardContent class="space-y-2 text-sm text-blue-900">
        <p><strong>Steps 1-5:</strong> Setup phase completed in Tournament Setup Wizard</p>
        <p>✓ Prize Pool • ✓ Course • ✓ Tournaments • ✓ Summary • ✓ Data Ready</p>
        <p class="mt-3 border-t border-blue-300 pt-3"><strong>Step 6:</strong> Generate Groups – Create player groups, tee times, and prize distributions</p>
        <p><strong>Step 7:</strong> Live Scoring – Enter scores hole-by-hole during tournaments</p>
        <p class="mt-3 border-t border-blue-300 pt-3">Then check <strong>League Standings</strong> to track progress and <strong>Tournament Dashboard</strong> for overview</p>
      </CardContent>
    </Card>
  </div>
</div>
