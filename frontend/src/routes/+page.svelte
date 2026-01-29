<script lang="ts">
  import { pb } from "$lib/pb";
  console.log("PB baseUrl:", pb.baseUrl);
  import { Course, Tournament } from "@oop-draft-2/shared";

  import { Button } from "$lib/components/ui/button";
  import * as Card from "$lib/components/ui/card";

  const t = new Tournament("FLI Championship", new Date("2026-02-15"));
  const c = new Course("FLI Stadium Course", [
    250, 300, 275, 325, 290, 310, 260, 340, 280
  ]);
</script>

<div class="p-6 space-y-6 max-w-3xl">
  <Card.Root>
    <Card.Header class="space-y-2">
      <Card.Title class="text-3xl text-blue-600">
        {t.name}
      </Card.Title>
      <Card.Description>
        {t.date.toDateString()}
      </Card.Description>
    </Card.Header>

    <Card.Content class="space-y-4">
      <div class="flex items-center justify-between gap-4">
        <div class="text-sm">
          <span class="font-medium">{c.name}</span>
          <span class="text-muted-foreground"> — {c.holes.length} holes</span>
        </div>

        <Button size="sm">Create Round</Button>
      </div>

      <!-- Holes table (Tailwind styled) -->
      <div class="rounded-lg border overflow-hidden">
        <div class="max-h-[420px] overflow-auto">
          <table class="w-full text-sm">
            <thead class="sticky top-0 bg-background">
              <tr class="border-b">
                <th class="text-left font-medium px-4 py-3">Hole</th>
                <th class="text-left font-medium px-4 py-3">Par</th>
                <th class="text-left font-medium px-4 py-3">Distance</th>
              </tr>
            </thead>

            <tbody>
              {#each c.holes as h}
                <tr class="border-b last:border-0 hover:bg-muted/50">
                  <td class="px-4 py-3 tabular-nums">{h.number}</td>
                  <td class="px-4 py-3 tabular-nums">{h.par}</td>
                  <td class="px-4 py-3 tabular-nums">{h.distance} ft</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    </Card.Content>
  </Card.Root>
</div>
