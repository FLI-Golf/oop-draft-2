<script lang="ts">
  /**
   * Prize Pool Step - Configure season prize pool
   * Step 1 of tournament setup wizard
   */
  
  import { enhance } from '$app/forms';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  
  export let data: {
    seasonSettingsMap?: Record<string, { prizePool: number; distributed: boolean }>;
  };
  export let onComplete: (season: string, amount: number) => void = () => {};
  export let onNext: () => void = () => {};
  
  type SeasonSettings = {
    prizePool: number;
    distributed: boolean;
  };
  
  let prizePoolSeason = '2026';
  let prizePoolAmount = '4000000';
  let status = '';
  let error = '';
  let isSubmitting = false;
  
  $: currentSeasonSettings = data.seasonSettingsMap?.[prizePoolSeason] as SeasonSettings | undefined;
  $: hasPrizePool = !!currentSeasonSettings?.prizePool;
</script>

<Card>
  <CardHeader>
    <CardTitle>Step 1: Season Prize Pool</CardTitle>
    <p class="text-sm text-muted-foreground">
      Set the total prize pool for a season. Prize money will be distributed across all tournaments 
      ensuring every team gets paid.
    </p>
  </CardHeader>
  <CardContent class="space-y-4">
    {#if status}
      <p class="text-sm text-emerald-600">{status}</p>
    {/if}
    {#if error}
      <p class="text-sm text-red-600">{error}</p>
    {/if}
    
    <form
      method="POST"
      action="?/setSeasonPrizePool"
      use:enhance={() => {
        isSubmitting = true;
        return async ({ result, update }) => {
          if (result.type === 'success') {
            status = 'Prize pool saved ✅';
            error = '';
            isSubmitting = false;
            const amount = parseInt(prizePoolAmount, 10);
            onComplete(prizePoolSeason, amount);
            // Auto-advance to next step after short delay
            setTimeout(() => {
              onNext();
            }, 500);
          } else if (result.type === 'failure') {
            status = '';
            error = (result.data as Record<string, any>)?.error || 'Failed to set prize pool.';
            isSubmitting = false;
          } else if (result.type === 'error') {
            status = '';
            error = (result.error as Record<string, any>)?.message || 'Unexpected error occurred.';
            isSubmitting = false;
          }
          await update();
        };
      }}
    >
      <div class="grid gap-3 sm:grid-cols-3">
        <div class="space-y-1">
          <label class="text-xs text-muted-foreground" for="prizePoolSeason">
            Season
          </label>
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
          <label class="text-xs text-muted-foreground" for="prizePoolAmount">
            Prize Pool
          </label>
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
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Set Prize Pool'}
          </Button>
        </div>
      </div>

      {#if currentSeasonSettings}
        <div class="mt-3 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">
          <strong>{prizePoolSeason} Prize Pool:</strong> 
          ${(currentSeasonSettings.prizePool / 1000000).toFixed(0)}M
          {#if currentSeasonSettings.distributed}
            <span class="ml-2 text-emerald-600">(Distributed)</span>
          {:else}
            <span class="ml-2 text-amber-600">(Not yet distributed)</span>
          {/if}
        </div>
      {:else}
        <p class="mt-3 text-xs text-muted-foreground">
          No prize pool set for {prizePoolSeason} yet.
        </p>
      {/if}
    </form>
  </CardContent>
</Card>
