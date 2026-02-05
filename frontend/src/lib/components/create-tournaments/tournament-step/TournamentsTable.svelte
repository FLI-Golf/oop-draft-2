<script lang="ts">
  /**
   * TournamentsTable - Sortable table of all tournaments
   */
  
  import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
  } from '$lib/components/ui/table';
  import { compare, toggleSort, getSortIndicator, type SortDirection } from '$lib/utils/sorting';
  
  type TournamentRecord = {
    id: string;
    name: string;
    date: string;
    course: string;
    seasonId?: string;
    expand?: {
      course?: { name: string };
      seasonId?: { id: string; year: string; active: boolean };
    };
  };
  
  type SortKey = 'name' | 'date' | 'course' | 'season';
  
  export let tournaments: TournamentRecord[] = [];
  
  let sortKey: SortKey = 'date';
  let sortDir: SortDirection = 'desc';
  
  function handleSort(key: SortKey) {
    const result = toggleSort(sortKey, key, sortDir);
    sortKey = result.sortKey as SortKey;
    sortDir = result.sortDir;
  }
  
  $: sortedTournaments = [...tournaments].sort((a, b) => {
    let av: any;
    let bv: any;
    
    switch (sortKey) {
      case 'date':
        av = new Date(a.date).getTime();
        bv = new Date(b.date).getTime();
        break;
      case 'name':
        av = (a.name ?? '').toLowerCase();
        bv = (b.name ?? '').toLowerCase();
        break;
      case 'course':
        av = (a.expand?.course?.name ?? a.course ?? '').toLowerCase();
        bv = (b.expand?.course?.name ?? b.course ?? '').toLowerCase();
        break;
      case 'season':
        av = a.expand?.seasonId?.year ?? '';
        bv = b.expand?.seasonId?.year ?? '';
        break;
    }
    
    const result = compare(av, bv);
    return sortDir === 'asc' ? result : -result;
  });
</script>

<div class="mt-6 pt-4 border-t">
  <h4 class="text-sm font-medium mb-2">All Tournaments</h4>
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>
          <button
            type="button"
            class="flex items-center gap-1 hover:underline"
            onclick={() => handleSort('name')}
          >
            Name{getSortIndicator('name', sortKey, sortDir)}
          </button>
        </TableHead>
        <TableHead>
          <button
            type="button"
            class="flex items-center gap-1 hover:underline"
            onclick={() => handleSort('date')}
          >
            Date{getSortIndicator('date', sortKey, sortDir)}
          </button>
        </TableHead>
        <TableHead>
          <button
            type="button"
            class="flex items-center gap-1 hover:underline"
            onclick={() => handleSort('course')}
          >
            Course{getSortIndicator('course', sortKey, sortDir)}
          </button>
        </TableHead>
        <TableHead>
          <button
            type="button"
            class="flex items-center gap-1 hover:underline"
            onclick={() => handleSort('season')}
          >
            Season{getSortIndicator('season', sortKey, sortDir)}
          </button>
        </TableHead>
        <TableHead class="w-12 text-right"></TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {#each sortedTournaments as t}
        <TableRow class="group">
          <TableCell>{t.name}</TableCell>
          <TableCell>{new Date(t.date).toDateString()}</TableCell>
          <TableCell>{t.expand?.course?.name ?? t.course}</TableCell>
          <TableCell>{t.expand?.seasonId?.year ?? '-'}</TableCell>
          <TableCell class="text-right">
            <a
              href={`/tournaments/${t.id}/settings`}
              class="inline-flex items-center justify-center rounded-md p-2 opacity-0 
                transition group-hover:opacity-100 hover:bg-black/10 focus:outline-none focus:ring"
              aria-label={`Open settings for ${t.name}`}
              title="Tournament settings"
            >
              ⚙️
            </a>
          </TableCell>
        </TableRow>
      {/each}
    </TableBody>
  </Table>
</div>
