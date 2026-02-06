/**
 * Form validation utilities
 * Validation rules for tournament setup forms
 */

/**
 * Validate course name input
 * @returns error message or null if valid
 */
export function validateCourseName(name: string): string | null {
  if (!name || name.trim().length === 0) {
    return 'Course name is required';
  }
  if (name.trim().length < 3) {
    return 'Course name must be at least 3 characters';
  }
  if (name.length > 100) {
    return 'Course name must be less than 100 characters';
  }
  return null;
}

/**
 * Validate tournament name input
 * @returns error message or null if valid
 */
export function validateTournamentName(name: string): string | null {
  if (!name || name.trim().length === 0) {
    return 'Tournament name is required';
  }
  if (name.length > 100) {
    return 'Tournament name must be less than 100 characters';
  }
  return null;
}

/**
 * Validate tournament date input
 * @returns error message or null if valid
 */
export function validateTournamentDate(date: string): string | null {
  if (!date) {
    return 'Date is required';
  }
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date format';
  }
  // Optional: Check if date is not in the past
  // const today = new Date();
  // today.setHours(0, 0, 0, 0);
  // if (dateObj < today) {
  //   return 'Tournament date cannot be in the past';
  // }
  return null;
}

/**
 * Validate hole distances array
 * @returns error message or null if valid
 */
export function validateHoleDistances(distances: number[]): string | null {
  if (!distances || distances.length !== 9) {
    return 'Must have exactly 9 holes';
  }
  
  for (let i = 0; i < distances.length; i++) {
    const d = distances[i];
    if (typeof d !== 'number' || isNaN(d)) {
      return `Hole ${i + 1} must be a valid number`;
    }
    if (d < 100 || d > 600) {
      return `Hole ${i + 1} distance must be between 100 and 600 yards (got ${d})`;
    }
  }
  
  return null;
}

/**
 * Parse comma-separated hole distances string
 * @returns array of numbers or null if invalid
 */
export function parseHoleDistances(input: string): number[] | null {
  if (!input || input.trim().length === 0) {
    return null;
  }
  
  const parts = input.split(',').map(s => s.trim());
  if (parts.length !== 9) {
    return null;
  }
  
  const distances = parts.map(p => parseInt(p, 10));
  if (distances.some(d => isNaN(d))) {
    return null;
  }
  
  return distances;
}

/**
 * Validate prize pool amount
 * @returns error message or null if valid
 */
export function validatePrizePool(amount: number): string | null {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return 'Prize pool must be a valid number';
  }
  if (amount < 0) {
    return 'Prize pool cannot be negative';
  }
  if (amount < 1000000) {
    return 'Prize pool must be at least $1 million';
  }
  if (amount > 10000000) {
    return 'Prize pool cannot exceed $10 million';
  }
  return null;
}

/**
 * Validate season year
 * @returns error message or null if valid
 */
export function validateSeason(season: string | number): string | null {
  const year = typeof season === 'string' ? parseInt(season, 10) : season;
  
  if (isNaN(year)) {
    return 'Season must be a valid year';
  }
  
  const currentYear = new Date().getFullYear();
  if (year < currentYear - 1) {
    return 'Season cannot be more than 1 year in the past';
  }
  if (year > currentYear + 10) {
    return 'Season cannot be more than 10 years in the future';
  }
  
  return null;
}
