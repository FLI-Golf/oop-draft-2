<script lang="ts">
  export let data;

  const t = data.tournament;
  const s = data.settings;
</script>

<div class="p-6 space-y-6">
  <div>
    <h1 class="text-xl font-semibold">Tournament settings</h1>
    <p class="text-sm text-muted-foreground">{t.name ?? t.id}</p>
  </div>

  {#if data?.error}
    <p class="text-sm text-red-600">{data.error}</p>
  {/if}

  <form method="POST" action="?/save" class="space-y-4 max-w-md">
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
