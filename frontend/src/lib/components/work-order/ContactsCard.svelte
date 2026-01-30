<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "$lib/components/ui/card";
  import { ChevronDown, ChevronUp } from "lucide-svelte";

  export let id: string;
  export let collapsed: boolean;
  export let onToggle: () => void;

  function onKeydown(e: KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") onToggle();
  }
</script>

<Card>
  <CardHeader
    class="cursor-pointer select-none"
    role="button"
    tabindex="0"
    aria-expanded={!collapsed}
    on:click={onToggle}
    on:keydown={onKeydown}
  >
    <CardTitle class="flex items-center justify-between gap-3">
      <span>📇 Client & Contacts</span>

      <div class="ml-auto flex items-center gap-3">
        <button
          type="button"
          class="inline-flex h-8 w-8 items-center justify-center rounded-md border hover:bg-muted"
          aria-label={collapsed ? "Expand section" : "Collapse section"}
          on:click|stopPropagation={onToggle}
        >
          {#if collapsed}
            <ChevronDown class="h-4 w-4 pointer-events-none" />
          {:else}
            <ChevronUp class="h-4 w-4 pointer-events-none" />
          {/if}
        </button>
      </div>
    </CardTitle>

    <CardDescription>Key stakeholders for this prototype.</CardDescription>
  </CardHeader>

  {#if !collapsed}
    <CardContent class="grid gap-4 sm:grid-cols-2 text-sm">
      <div class="space-y-1">
        <div><span class="font-medium">Client:</span> FLI Golf League</div>
        <div><span class="font-medium">IT Director:</span> Dustin Dinsmore</div>
      </div>

      <div class="space-y-1">
        <div class="font-medium">Primary Contacts</div>
        <div class="text-muted-foreground">Andrew Panza (CEO / Founder) — 716-572-8319 andrew@fligolf.com</div>
        <div class="text-muted-foreground">Dustin Dinsmore (IT Director / CTO) — 626-222-3107 dustin@fligolf.com</div>
      </div>
    </CardContent>
  {/if}
</Card>
