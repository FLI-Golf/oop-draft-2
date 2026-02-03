<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
  } from "$lib/components/ui/table";

  export let data;

  $: teams = data.teams ?? [];
  $: rosteredPlayers = data.rosteredPlayers ?? [];
  $: reservePlayers = data.reservePlayers ?? [];
  $: upcomingTournaments = data.upcomingTournaments ?? [];
  $: seasonSettings = data.seasonSettings ?? [];

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  }
</script>

<div class="p-6 max-w-7xl mx-auto space-y-6">
  <div class="flex items-start justify-between">
    <div class="space-y-1">
      <h1 class="text-3xl font-bold">FLI Golf League</h1>
      <p class="text-muted-foreground">Teams, players, standings, and upcoming events</p>
    </div>

    <Button variant="outline" asChild>
      <a href="/">← Home</a>
    </Button>
  </div>

  <!-- Season Overview -->
  {#if seasonSettings.length > 0}
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {#each seasonSettings as season}
        <Card>
          <CardHeader class="pb-2">
            <CardTitle class="text-sm font-medium text-muted-foreground">{season.season} Season</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{formatCurrency(season.prizePool)}</div>
            <p class="text-xs text-muted-foreground">
              {season.distributed ? "Prize pool distributed" : "Prize pool set"}
            </p>
          </CardContent>
        </Card>
      {/each}

      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium text-muted-foreground">Teams</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{teams.length}</div>
          <p class="text-xs text-muted-foreground">Pro teams competing</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium text-muted-foreground">Players</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{rosteredPlayers.length + reservePlayers.length}</div>
          <p class="text-xs text-muted-foreground">{rosteredPlayers.length} rostered, {reservePlayers.length} reserves</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium text-muted-foreground">Upcoming Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{upcomingTournaments.length}</div>
          <p class="text-xs text-muted-foreground">Tournaments scheduled</p>
        </CardContent>
      </Card>
    </div>
  {/if}

  <!-- Team Standings -->
  <Card>
    <CardHeader>
      <CardTitle>Team Standings</CardTitle>
      <p class="text-sm text-muted-foreground">
        Rankings based on points and earnings. Each team has one male and one female pro.
      </p>
    </CardHeader>
    <CardContent>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead class="w-12">Rank</TableHead>
            <TableHead>Team</TableHead>
            <TableHead>Male Pro</TableHead>
            <TableHead>Female Pro</TableHead>
            <TableHead class="text-right">Points</TableHead>
            <TableHead class="text-right">Earnings</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {#if teams.length === 0}
            <TableRow>
              <TableCell colspan="6" class="text-muted-foreground">No teams yet.</TableCell>
            </TableRow>
          {:else}
            {#each teams as team, i}
              <TableRow>
                <TableCell class="font-medium">{i + 1}</TableCell>
                <TableCell class="font-semibold">{team.name}</TableCell>
                <TableCell>
                  {#if team.expand?.malePlayer}
                    <div>{team.expand.malePlayer.name}</div>
                    <div class="text-xs text-muted-foreground">
                      Rating: {team.expand.malePlayer.rating} | #{team.expand.malePlayer.world_ranking}
                    </div>
                  {:else}
                    -
                  {/if}
                </TableCell>
                <TableCell>
                  {#if team.expand?.femalePlayer}
                    <div>{team.expand.femalePlayer.name}</div>
                    <div class="text-xs text-muted-foreground">
                      Rating: {team.expand.femalePlayer.rating} | #{team.expand.femalePlayer.world_ranking}
                    </div>
                  {:else}
                    -
                  {/if}
                </TableCell>
                <TableCell class="text-right">{team.team_points ?? 0}</TableCell>
                <TableCell class="text-right">{formatCurrency(team.team_earnings ?? 0)}</TableCell>
              </TableRow>
            {/each}
          {/if}
        </TableBody>
      </Table>
    </CardContent>
  </Card>

  <!-- Upcoming Tournaments -->
  <Card>
    <CardHeader>
      <CardTitle>Upcoming Tournaments</CardTitle>
    </CardHeader>
    <CardContent>
      {#if upcomingTournaments.length === 0}
        <p class="text-muted-foreground">No upcoming tournaments scheduled.</p>
      {:else}
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {#each upcomingTournaments as tournament}
            <div class="rounded-lg border p-4">
              <h3 class="font-semibold">{tournament.name}</h3>
              <p class="text-sm text-muted-foreground">{formatDate(tournament.date)}</p>
              <p class="text-xs text-muted-foreground mt-1">Season {tournament.season}</p>
            </div>
          {/each}
        </div>
      {/if}
    </CardContent>
  </Card>

  <!-- Reserve Players -->
  {#if reservePlayers.length > 0}
    <Card>
      <CardHeader>
        <CardTitle>Reserve Players</CardTitle>
        <p class="text-sm text-muted-foreground">
          Available to fill in when rostered players are unavailable.
        </p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead class="text-right">Rating</TableHead>
              <TableHead class="text-right">World Ranking</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {#each reservePlayers as player}
              <TableRow>
                <TableCell class="font-medium">{player.name}</TableCell>
                <TableCell class="capitalize">{player.gender}</TableCell>
                <TableCell class="text-right">{player.rating}</TableCell>
                <TableCell class="text-right">#{player.world_ranking ?? "-"}</TableCell>
              </TableRow>
            {/each}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  {/if}
</div>
