/**
 * Table sorting utilities
 * Extracted from CreateTournaments.svelte to make sorting logic reusable
 */

export type SortDirection = 'asc' | 'desc';

/**
 * Compare two values for sorting
 * Handles null/undefined values and type-specific comparisons
 */
export function compare(a: any, b: any): number {
  if (a === b) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  return a < b ? -1 : 1;
}

/**
 * Toggle sort direction or change sort key
 * Returns new sortKey and sortDir based on current state
 */
export function toggleSort(
  currentKey: string,
  newKey: string,
  currentDir: SortDirection
): { sortKey: string; sortDir: SortDirection } {
  if (currentKey === newKey) {
    // Same column - toggle direction
    return {
      sortKey: newKey,
      sortDir: currentDir === 'asc' ? 'desc' : 'asc'
    };
  } else {
    // Different column - use default direction
    // Dates typically sort descending (newest first), others ascending
    return {
      sortKey: newKey,
      sortDir: newKey === 'date' ? 'desc' : 'asc'
    };
  }
}

/**
 * Get visual indicator for sort state
 * Returns arrow symbols or empty string
 */
export function getSortIndicator(
  columnKey: string,
  sortKey: string,
  sortDir: SortDirection
): string {
  if (sortKey !== columnKey) return '';
  return sortDir === 'asc' ? ' ▲' : ' ▼';
}

/**
 * Generic sorting function for arrays
 * Usage: items.slice().sort(createSorter('name', 'asc', (item) => ({ name: item.name })))
 */
export function createSorter<T>(
  sortKey: string,
  sortDir: SortDirection,
  getValue: (item: T) => any
): (a: T, b: T) => number {
  return (a: T, b: T) => {
    const av = getValue(a);
    const bv = getValue(b);
    const result = compare(av, bv);
    return sortDir === 'asc' ? result : -result;
  };
}
