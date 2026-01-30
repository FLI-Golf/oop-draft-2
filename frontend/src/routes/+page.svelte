<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
</script>

<div class="p-8 max-w-4xl mx-auto space-y-6">
  <div class="space-y-2">
    <h1 class="text-4xl font-bold">FLI Golf League Prototype</h1>
    <p class="text-muted-foreground">
      Internal prototype for the FLI Golf League website + companion mobile app (fans, players, admins).
    </p>
  </div>

  <Card>
    <CardHeader>
      <CardTitle>Work Order Snapshot</CardTitle>
    </CardHeader>
    <CardContent class="space-y-3">
      <div class="text-sm">
        <div><span class="font-medium">Client:</span> FLI Golf League</div>
        <div><span class="font-medium">Primary Contacts:</span> Andrew Panza (Founder / Co-Creator) • 716-572-8319 · Dustin Dinsmore (CTO / Co-Creator)</div>
      </div>

      <div class="grid gap-2 text-sm">
        <div class="font-medium">Scope (high level)</div>
        <ul class="list-disc pl-5 text-muted-foreground">
          <li>Website: schedule, tournaments, teams, players, news/media, merch (WooCommerce)</li>
          <li>Fantasy: web companion + mobile core experience tied to real-time results</li>
          <li>Admin tools: data entry, overrides, media publishing</li>
        </ul>
      </div>

      <div class="flex flex-wrap gap-3 pt-2">
        <a href="/tournaments"><Button>Tournaments Admin</Button></a>
        <a href="/work-order"><Button variant="outline">Full Work Order</Button></a>
      </div>
    </CardContent>
  </Card>

  <div class="text-xs text-muted-foreground">
    Note: This repo is a reference implementation for a future team build (architecture, schema, and patterns).
  </div>
</div>
