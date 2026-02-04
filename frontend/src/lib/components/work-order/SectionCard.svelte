<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "$lib/components/ui/card";
  import { ChevronDown, ChevronUp } from "lucide-svelte";

  type Task = { id: string; text: string };
  type Section = { id: string; title: string; description?: string; tasks: Task[] };

  export let section: Section;
  export let collapsed: boolean;
  export let onToggle: () => void;
  
  // Keep these for backwards compatibility but they're optional now
  export let prog: { done: number; total: number } | null = null;
  export let checked: Record<string, boolean> = {};
  export let onToggleTask: (id: string) => void = () => {};

  function onKeydown(e: KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") onToggle();
  }

  // Count completed tasks by checking for ✅ prefix
  $: completedCount = section.tasks.filter(t => t.text.startsWith("✅")).length;
  $: totalCount = section.tasks.length;
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
      <span>{section.title}</span>

      <div class="ml-auto flex items-center gap-3">
        <span class="text-sm text-muted-foreground whitespace-nowrap">
          {completedCount}/{totalCount} done
        </span>

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

    {#if section.description}
      <CardDescription>{section.description}</CardDescription>
    {/if}
  </CardHeader>

  {#if !collapsed}
    <CardContent class="space-y-2">
      {#each section.tasks as t (t.id)}
        {@const isComplete = t.text.startsWith("✅")}
        <div class="rounded-md border p-3 {isComplete ? 'bg-emerald-50 border-emerald-200' : ''}">
          <div class="text-sm leading-snug">{t.text}</div>
        </div>
      {/each}
    </CardContent>
  {/if}
</Card>
