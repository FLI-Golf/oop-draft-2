<script lang="ts">
  /**
   * TournamentFormGrid - Grid of 6 tournament creation forms
   */
  
  import { enhance } from '$app/forms';
  import * as nav from '$app/navigation';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { createFormHandler } from '$lib/utils/formHandlers';
  
  type TournamentForm = {
    name: string;
    date: string;
    created: boolean;
    skip: boolean;
  };
  
  type CourseRecord = { id: string; name: string };
  
  export let forms: TournamentForm[] = [];
  export let selectedCourseId: string = '';
  export let season: string = '2026';
  export let onTournamentUpdate: (index: number) => void = () => {};
  
  let isCreatingAll = false;
  let createAllStatus = '';
  let createAllError = '';
  
  $: uncreatedForms = forms.filter(f => !f.created && !f.skip);
  
  /**
   * Create all uncreated tournaments in sequence
   */
  async function createAllTournaments() {
    if (!selectedCourseId) {
      createAllError = 'Please select a course first.';
      return;
    }
    
    isCreatingAll = true;
    createAllError = '';
    createAllStatus = 'Creating tournaments...';
    
    try {
      for (let i = 0; i < forms.length; i++) {
        if (forms[i].created || forms[i].skip) continue;
        
        const formData = new FormData();
        formData.append('name', forms[i].name);
        formData.append('date', forms[i].date);
        formData.append('course', selectedCourseId);
        formData.append('season', season);
        
        const response = await fetch('?/createTournament', {
          method: 'POST',
          body: formData
        });
        
        const result = await response.json();
        
        if (result.type === 'success') {
          forms[i].created = true;
          onTournamentUpdate(i);
          const createdCount = forms.filter(f => f.created).length;
          createAllStatus = `Created ${createdCount} of 6 tournaments...`;
        } else {
          throw new Error(result.data?.error || 'Failed to create tournament');
        }
      }
      
      createAllStatus = 'All tournaments created ✅';
      await nav.invalidateAll();
      
      // Auto-navigate after completion
      setTimeout(async () => {
        await nav.goto('/displays');
      }, 1000);
    } catch (e: any) {
      createAllError = e.message || 'Failed to create tournaments';
      createAllStatus = '';
    } finally {
      isCreatingAll = false;
    }
  }
  
  function createSingleHandler(index: number) {
    return createFormHandler({
      onSuccess: async (result) => {
        forms[index].created = true;
        onTournamentUpdate(index);
        await nav.invalidateAll();
        
        // Check if all are done and navigate
        const allDone = forms.every(f => f.created || f.skip);
        if (allDone) {
          setTimeout(async () => {
            await nav.goto('/displays');
          }, 500);
        }
      },
      onFailure: (result) => {
        console.error('Tournament creation failed:', result);
      }
    });
  }
</script>

<div class="space-y-4">
  {#if createAllStatus}
    <p class="text-sm text-emerald-600">{createAllStatus}</p>
  {/if}
  {#if createAllError}
    <p class="text-sm text-red-600">{createAllError}</p>
  {/if}
  
  <!-- Create All Button -->
  {#if uncreatedForms.length > 0}
    <div class="flex justify-end">
      <Button
        onclick={createAllTournaments}
        disabled={isCreatingAll || !selectedCourseId}
        variant="default"
      >
        {isCreatingAll ? 'Creating...' : `Create All ${uncreatedForms.length} Remaining`}
      </Button>
    </div>
  {/if}
  
  <!-- 6 Tournament Forms -->
  <div class="grid gap-4">
    {#each forms as form, i}
      <div 
        class="p-4 rounded-lg border 
        {form.created 
          ? 'bg-emerald-50 border-emerald-300' 
          : form.skip 
            ? 'bg-gray-50 border-gray-300' 
            : 'bg-white'}"
      >
        <form
          method="POST"
          action="?/createTournament"
          use:enhance={createSingleHandler(i)}
        >
          <input type="hidden" name="season" value={season} />
          <input type="hidden" name="course" value={selectedCourseId} />
          
          <div class="flex items-center gap-4">
            <span class="text-lg font-bold text-gray-400 w-8">{i + 1}</span>
            
            <div class="flex-1 grid gap-3 sm:grid-cols-2">
              <div class="space-y-1">
                <label class="text-xs text-muted-foreground" for={`tournament-name-${i}`}>Name</label>
                <Input 
                  id={`tournament-name-${i}`}
                  name="name" 
                  bind:value={form.name}
                  disabled={form.created || form.skip}
                />
              </div>

              <div class="space-y-1">
                <label class="text-xs text-muted-foreground" for={`tournament-date-${i}`}>Date</label>
                <Input 
                  id={`tournament-date-${i}`}
                  name="date" 
                  type="date" 
                  bind:value={form.date}
                  disabled={form.created || form.skip}
                />
              </div>
            </div>

            <div class="flex items-center gap-2">
              <label 
                class="flex items-center gap-2 cursor-pointer" 
                title="Skip creating this tournament"
              >
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
</div>
