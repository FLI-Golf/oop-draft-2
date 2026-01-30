<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "$lib/components/ui/card";
  import { ChevronDown, ChevronUp } from "lucide-svelte";

  type Task = { id: string; text: string };
  type Section = { id: string; title: string; description?: string; tasks: Task[] };
  type Progress = { done: number; total: number };

  export let section: Section;
  export let collapsed: boolean;
  export let prog: Progress;
  export let checked: Record<string, boolean>;
  export let onToggle: () => void;
  export let onToggleTask: (id: string) => void;

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
      <span>{section.title}</span>

      <div class="ml-auto flex items-center gap-3">
        <span class="text-sm text-muted-foreground whitespace-nowrap">
        {prog.done}/{prog.total} Tasks completed
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
        <label class="flex items-start gap-3 rounded-md border p-3 hover:bg-muted/40 cursor-pointer">
          <input
            type="checkbox"
            class="mt-1 h-4 w-4"
            checked={!!checked[t.id]}
            on:change={() => onToggleTask(t.id)}
          />
          <div class="text-sm">
            <div class="leading-snug">{t.text}</div>
          </div>
        </label>
      {/each}
    </CardContent>
  {/if}
</Card>
