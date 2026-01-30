<script lang="ts">
  import { enhance } from "$app/forms";
  import * as nav from "$app/navigation";

  // shadcn-svelte (adjust paths if yours differ)
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import * as Select from "$lib/components/ui/select";
  import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
  } from "$lib/components/ui/table";

  export let data: {
    courses: { id: string; name: string }[];
    tournaments: {
      id: string;
      name: string;
      date: string;
      course: string;
      season?: "2026" | "2027" | "2028" | "2029";
      expand?: { course?: { name: string } };
    }[];
  };

  let selectedCourseId = data.courses?.[0]?.id ?? "";
  let tournamentName = "FLI Championship";
  let tournamentDate = "2026-02-15";
  let season: "2026" | "2027" | "2028" | "2029" = "2026";

  let status = "";
  let error = "";
</script>

<div class="space-y-6 max-w-3xl">
  <div class="space-y-1">
    <h1 class="text-3xl font-bold">Tournaments</h1>
    {#if status}
      <p class="text-sm text-emerald-600">{status}</p>
    {/if}
    {#if error}
      <p class="text-sm text-red-600">{error}</p>
    {/if}
  </div>

  <Card>
    <CardHeader>
      <CardTitle>Create tournament</CardTitle>
    </CardHeader>
    <CardContent class="space-y-4">
      <form
        method="POST"
        action="?/createTournament"
        use:enhance={() => {
          return async ({ result }) => {
            if (result.type === "success") {
              status = "Created ✅";
              error = "";
              await nav.invalidateAll();
              return;
            }

            if (result.type === "failure") {
              status = "";
              error = (result.data as { error?: string })?.error ?? "Create failed.";
              return;
            }

            status = "";
            error =
              result.type === "error"
                ? result.error?.message ?? "Unexpected error."
                : "Redirecting…";
          };
        }}
      >
        <div class="grid gap-3 sm:grid-cols-2">
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground" for="tseason">Season</label>

            <!-- shadcn select wrapper -->
            <Select.Root name="season" bind:value={season}>
              <Select.Trigger id="tseason">
                <Select.Value placeholder="Select season" />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="2026">2026</Select.Item>
                <Select.Item value="2027">2027</Select.Item>
                <Select.Item value="2028">2028</Select.Item>
                <Select.Item value="2029">2029</Select.Item>
              </Select.Content>
            </Select.Root>
          </div>

          <div class="space-y-1">
            <label class="text-xs text-muted-foreground" for="tname">Tournament name</label>
            <Input id="tname" name="name" bind:value={tournamentName} />
          </div>

          <div class="space-y-1">
            <label class="text-xs text-muted-foreground" for="tdate">Date</label>
            <Input id="tdate" name="date" type="date" bind:value={tournamentDate} />
          </div>

          <div class="space-y-1">
            <label class="text-xs text-muted-foreground" for="tcourse">Course</label>
            <!-- If you don’t have shadcn Select wired well yet, keep native select -->
            <select
              id="tcourse"
              name="course"
              class="w-full rounded-md border px-3 py-2 text-sm"
              bind:value={selectedCourseId}
              required
            >
              {#each data.courses as c}
                <option value={c.id}>{c.name}</option>
              {/each}
            </select>
          </div>
        </div>

        <div class="mt-4">
          <Button type="submit" disabled={!selectedCourseId}>
            Create tournament
          </Button>
        </div>
      </form>
    </CardContent>
  </Card>

  <Card>
    <CardHeader>
      <CardTitle>All tournaments</CardTitle>
    </CardHeader>
    <CardContent>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Course</TableHead>
            <TableHead>Season</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {#if data.tournaments.length === 0}
            <TableRow>
              <TableCell colspan="4" class="text-muted-foreground">No tournaments yet.</TableCell>
            </TableRow>
          {:else}
            {#each data.tournaments as t}
              <TableRow>
                <TableCell>{t.name}</TableCell>
                <TableCell>{new Date(t.date).toDateString()}</TableCell>
                <TableCell>{t.expand?.course?.name ?? t.course}</TableCell>
                <TableCell>{t.season ?? "-"}</TableCell>
              </TableRow>
            {/each}
          {/if}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
</div>
