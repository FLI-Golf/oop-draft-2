<script lang="ts">
  import CreateTournaments from "$lib/components/CreateTournaments.svelte";
  export let data;
</script>

<div class="p-6">
  <CreateTournaments {data} />
</div>
