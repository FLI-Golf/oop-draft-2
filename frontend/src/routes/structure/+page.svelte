<script lang="ts">
  import SchemaChart from "./SchemaChart.svelte";
</script>

<div class="p-6 space-y-4">
  <div>
    <h1 class="text-3xl font-bold">Database Schema</h1>
    <p class="text-muted-foreground text-sm">
      Interactive entity-relationship diagram. Drag nodes to rearrange. Scroll to zoom.
    </p>
  </div>
  <SchemaChart />
</div>
