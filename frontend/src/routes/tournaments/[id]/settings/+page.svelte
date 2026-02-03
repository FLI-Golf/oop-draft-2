<script lang="ts">
  import { enhance } from "$app/forms";
  import { Button } from "$lib/components/ui/button";
  
  export let data;
  export let form;

  $: t = data.tournament;
  $: s = data.settings;
  
  let status = "";
</script>

<div class="p-6 space-y-6">
  <div class="flex items-start justify-between">
    <div>
      <h1 class="text-xl font-semibold">Tournament settings</h1>
      <p class="text-sm text-muted-foreground">{t.name ?? t.id}</p>
    </div>
    <Button variant="outline" asChild>
      <a href="/tournaments">← Back to Tournaments</a>
    </Button>
  </div>

  {#if form?.error}
    <p class="text-sm text-red-600">{form.error}</p>
  {/if}
  
  {#if form?.success || status}
    <p class="text-sm text-emerald-600">Settings saved successfully!</p>
  {/if}

  <form 
    method="POST" 
    action="?/save" 
    class="space-y-4 max-w-md"
    use:enhance={() => {
      status = "";
      return async ({ result, update }) => {
        if (result.type === "success") {
          status = "saved";
        }
        await update();
      };
    }}
  >
    <input type="hidden" name="settingsId" value={s.id} />

    <div class="space-y-1">
      <label class="text-sm font-medium" for="startingHole">Starting hole</label>
      <input
        id="startingHole"
        name="startingHole"
        type="number"
        min="1"
        class="w-full rounded border p-2"
        value={s.startingHole}
      />
    </div>

    <div class="space-y-1">
      <label class="text-sm font-medium" for="intervalMinutes">Interval minutes</label>
      <input
        id="intervalMinutes"
        name="intervalMinutes"
        type="number"
        min="1"
        class="w-full rounded border p-2"
        value={s.intervalMinutes}
      />
    </div>

    <div class="space-y-1">
      <label class="text-sm font-medium" for="firstTeeTime">First tee time</label>
      <input
        id="firstTeeTime"
        name="firstTeeTime"
        type="time"
        class="w-full rounded border p-2"
        value={s.firstTeeTime}
      />
    </div>

    <div class="space-y-1">
      <label class="text-sm font-medium" for="format">Format</label>
      <select id="format" name="format" class="w-full rounded border p-2">
        <option value="stroke" selected={s.format === "stroke"}>stroke</option>
        <option value="match" selected={s.format === "match"}>match</option>
      </select>
    </div>

    <button class="rounded bg-black px-4 py-2 text-white" type="submit">
      Save
    </button>
  </form>
</div>
