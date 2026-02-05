# Plan: Modularize CreateTournaments into Step-based Architecture

## Overview

**TL;DR:** Restructure the 925-line monolith into 4 step folders with focused components, extract 3 utility modules for form handling/sorting/validation, and refactor the parent to orchestrate flow. Each step manages its own state and validation; the parent handles navigation and data passing. This improves testability, reusability, and maintainability while keeping related logic together.

## Current State Analysis

### CreateTournaments.svelte - 925 lines
**Main Responsibilities:**
1. **Multi-step form state management** (lines 20-41)
   - `currentStep` (1-4), navigation logic (`nextStep`, `prevStep`, `goToStep`)
   
2. **Sorting/filtering tournaments table** (lines 43-87)
   - `sortKey` and `sortDir` with `toggleSort()` function
   - Complex comparison logic for dates, names, courses, and seasons

3. **Step 1: Prize Pool** (lines 273-310)
   - Form submission for `setSeasonPrizePool` server action
   - Season selection (2026-2029)
   - Prize pool options ($2M-$6M)
   - Status/error display

4. **Step 2: Course creation** (lines 312-370)
   - Generate random course data (`generateCourse()`)
   - Form for course name + 9 hole distances
   - List of existing courses

5. **Step 3: Tournament creation** (lines 372-550)
   - 6 hardcoded tournament forms with name, date, created/skip states
   - Individual tournament creation + bulk "Create All" function (`createAllTournaments()`)
   - Computed properties tracking progress (`allTournamentsProcessed`, `createdCount`)
   - Tournaments data table with sortable columns
   - Season/course selection applying to all

6. **Step 4: Summary & completion** (lines 552-620)
   - Display of configured settings
   - Links to tournament settings pages
   - Preview of next steps (groups, displays)

**State Managed:**
```typescript
- currentStep, totalSteps
- sortKey, sortDir
- selectedCourseId, season
- status, error
- courseName, baseHoleDistances, courseStatus, courseError
- groupSeasonSelect, prizePoolSeason, prizePoolAmount
- 6x tournamentForms[] array with [name, date, created, skip]
- Computed: sortedTournaments, allTournamentsProcessed, createdCount, etc.
```

**External Dependencies:**
- **UI Components**: Card, Button, Input, Select, Table (from `$lib/components/ui/`)
- **SvelteKit**: `enhance` (form enhancement), `$app/navigation` (invalidation, goto)
- **Server Actions**: 4 form actions via `?/` syntax

## Target Structure

```
frontend/src/lib/components/
├── CreateTournaments.svelte (150-200 lines) - orchestrator only
├── create-tournaments/
│   ├── StepIndicator.svelte
│   ├── prize-pool-step/
│   │   ├── +page.svelte (60 lines)
│   │   └── PrizePoolForm.svelte
│   ├── course-step/
│   │   ├── +page.svelte (80 lines)
│   │   ├── CourseForm.svelte
│   │   └── CourseList.svelte
│   ├── tournament-step/
│   │   ├── +page.svelte (100 lines)
│   │   ├── TournamentFormGrid.svelte (60 lines)
│   │   └── TournamentsTable.svelte (90 lines)
│   └── summary-step/
│       └── +page.svelte (80 lines)
└── utils/
    ├── formHandlers.ts (shared `enhance` handler factory)
    ├── sorting.ts (table sorting logic)
    └── validation.ts (form validation rules)
```

## Implementation Steps

### Step 1: Create Utility Modules

#### 1.1 Create `frontend/src/lib/utils/sorting.ts`
Extract sorting logic from lines 43-87 of CreateTournaments.svelte

**Functions to extract:**
- `compare(a, b, sortKey)` - handles date, string, and nested object comparisons
- `toggleSort(currentKey, newKey, currentDir)` - returns new sortKey and sortDir
- `getSortIndicator(columnKey, sortKey, sortDir)` - returns '↑', '↓', or ''

**Usage:**
```typescript
import { compare, toggleSort, getSortIndicator } from '$lib/utils/sorting';

// In component
let sortKey = 'name';
let sortDir = 'asc';

function handleSort(key: string) {
  ({ sortKey, sortDir } = toggleSort(sortKey, key, sortDir));
}

$: sortedItems = items.slice().sort((a, b) => {
  const result = compare(a, b, sortKey);
  return sortDir === 'asc' ? result : -result;
});
```

#### 1.2 Create `frontend/src/lib/utils/formHandlers.ts`
Extract shared form enhancement patterns

**Factory function:**
```typescript
export function createFormHandler(options: {
  onSuccess?: (result) => void;
  onFailure?: (result) => void;
  onError?: (error) => void;
  getMessage?: (result) => string;
}) {
  return ({ result, update }) => {
    if (result.type === 'success') {
      options.onSuccess?.(result);
    } else if (result.type === 'failure') {
      options.onFailure?.(result);
    }
    
    if (result.type === 'error') {
      options.onError?.(result.error);
    }
    
    update();
  };
}
```

#### 1.3 Create `frontend/src/lib/utils/validation.ts`
Form validation rules

**Functions:**
```typescript
export function validateCourseName(name: string): string | null {
  if (!name || name.trim().length === 0) {
    return 'Course name is required';
  }
  if (name.length < 3) {
    return 'Course name must be at least 3 characters';
  }
  return null;
}

export function validateTournamentName(name: string): string | null {
  if (!name || name.trim().length === 0) {
    return 'Tournament name is required';
  }
  return null;
}

export function validateTournamentDate(date: string): string | null {
  if (!date) {
    return 'Date is required';
  }
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date format';
  }
  return null;
}

export function validateHoleDistances(distances: number[]): string | null {
  if (distances.length !== 9) {
    return 'Must have exactly 9 holes';
  }
  if (distances.some(d => d < 100 || d > 600)) {
    return 'Hole distances must be between 100 and 600 yards';
  }
  return null;
}
```

### Step 2: Create Step-based Component Structure

#### 2.1 Create `frontend/src/lib/components/create-tournaments/` folder
Base directory for all step components

#### 2.2 Create `frontend/src/lib/components/create-tournaments/StepIndicator.svelte`
Reusable progress indicator component

**Props:**
```typescript
export let currentStep: number;
export let totalSteps: number = 4;
export let stepLabels: string[] = ['Prize Pool', 'Course', 'Tournaments', 'Summary'];
export let onStepClick: (step: number) => void = () => {};
export let completedSteps: number[] = [];
```

**Functionality:**
- Display 4 circles with labels
- Highlight current step
- Show completed steps (checkmark or different color)
- Optional click navigation if step is accessible

### Step 3: Extract Prize Pool Step

#### 3.1 Create `frontend/src/lib/components/create-tournaments/prize-pool-step/+page.svelte`

**Props:**
```typescript
export let data: {
  seasonSettingsMap?: Record<number, { prizePool: number; distributed: boolean }>;
};
export let onComplete: (season: number, amount: number) => void = () => {};
```

**State:**
```typescript
let prizePoolSeason: number = 2026;
let prizePoolAmount: number = 2000000;
let status: 'idle' | 'submitting' | 'success' | 'error' = 'idle';
let error: string = '';
```

**Features:**
- Season dropdown (2026-2029)
- Prize pool amount select ($2M-$6M)
- Submit button with loading state
- Success/error message display
- Pre-populate if season already has prize pool configured

#### 3.2 Create `frontend/src/lib/components/create-tournaments/prize-pool-step/PrizePoolForm.svelte`
Optional: Separate form UI if needed for reusability

### Step 4: Extract Course Step

#### 4.1 Create `frontend/src/lib/components/create-tournaments/course-step/+page.svelte`

**Props:**
```typescript
export let courses: Array<{ id: string; name: string; baseHoleDistances: number[] }>;
export let selectedCourseId: string = '';
export let onCourseCreated: (courseId: string) => void = () => {};
export let onCourseSelected: (courseId: string) => void = () => {};
```

**State:**
```typescript
let courseName: string = '';
let baseHoleDistances: number[] = [];
let courseStatus: 'idle' | 'generating' | 'submitting' | 'success' | 'error' = 'idle';
let courseError: string = '';
```

**Features:**
- "Generate Course" button → calls `generateCourse()` utility
- Course form with name input + 9 hole distance inputs
- Submit button to create course
- List of existing courses with selection radio buttons
- Highlight currently selected course

**Utility function (moved from parent):**
```typescript
function generateCourse() {
  courseStatus = 'generating';
  courseName = `Course ${courses.length + 1}`;
  baseHoleDistances = Array.from({ length: 9 }, () => 
    Math.floor(Math.random() * (600 - 100 + 1)) + 100
  );
  courseStatus = 'idle';
}
```

#### 4.2 Create `frontend/src/lib/components/create-tournaments/course-step/CourseForm.svelte`
Form inputs for course creation

#### 4.3 Create `frontend/src/lib/components/create-tournaments/course-step/CourseList.svelte`
Display existing courses with selection

### Step 5: Extract Tournament Step (Most Complex)

#### 5.1 Create `frontend/src/lib/components/create-tournaments/tournament-step/+page.svelte`

**Props:**
```typescript
export let tournaments: Array<TournamentRecord>;
export let courses: Array<CourseRecord>;
export let data: {
  tournamentCountsBySeason?: Record<number, number>;
  groupsExistBySeason?: Record<number, boolean>;
};
export let selectedCourseId: string;
export let season: number;
export let onTournamentCreated: () => void = () => {};
```

**State:**
```typescript
let tournamentForms = [
  { name: 'Tournament 1', date: '2026-01-15', created: false, skip: false },
  { name: 'Tournament 2', date: '2026-02-15', created: false, skip: false },
  { name: 'Tournament 3', date: '2026-03-15', created: false, skip: false },
  { name: 'Tournament 4', date: '2026-04-15', created: false, skip: false },
  { name: 'Tournament 5', date: '2026-05-15', created: false, skip: false },
  { name: 'Tournament 6', date: '2026-06-15', created: false, skip: false },
];

let sortKey: string = 'date';
let sortDir: 'asc' | 'desc' = 'asc';
```

**Computed:**
```typescript
$: allTournamentsProcessed = tournamentForms.every(t => t.created || t.skip);
$: createdCount = tournamentForms.filter(t => t.created).length;
$: skippedCount = tournamentForms.filter(t => t.skip).length;
```

**Features:**
- Season + course selection (applies to all tournaments)
- Grid of 6 tournament forms
- "Create All Tournaments" button
- Tournaments table with sorting
- Progress indicators

#### 5.2 Create `frontend/src/lib/components/create-tournaments/tournament-step/TournamentFormGrid.svelte`

**Props:**
```typescript
export let forms: Array<{
  name: string;
  date: string;
  created: boolean;
  skip: boolean;
}>;
export let courses: Array<CourseRecord>;
export let selectedCourseId: string;
export let season: number;
export let onTournamentUpdate: (index: number, tournament: any) => void;
export let onCreateAll: () => void;
```

**Features:**
- Render 6 forms in a grid (2 columns on desktop)
- Each form has: name input, date input, course select (shared), season select (shared)
- Create button per tournament
- Skip checkbox per tournament
- "Create All" button at top
- Disable created/skipped forms

#### 5.3 Create `frontend/src/lib/components/create-tournaments/tournament-step/TournamentsTable.svelte`

**Props:**
```typescript
export let tournaments: Array<TournamentRecord>;
export let sortKey: string;
export let sortDir: 'asc' | 'desc';
export let onSort: (key: string) => void;
```

**Features:**
- Sortable columns: Name, Date, Course, Season
- Display tournament data from database
- Click column headers to sort
- Visual sort indicators (↑ ↓)
- Link to tournament settings pages

**Uses:**
- `import { compare, getSortIndicator } from '$lib/utils/sorting';`

### Step 6: Extract Summary Step

#### 6.1 Create `frontend/src/lib/components/create-tournaments/summary-step/+page.svelte`

**Props:**
```typescript
export let summary: {
  season: number;
  prizePool: number;
  courseName: string;
  tournamentsCreated: number;
  totalTournaments: number;
};
export let tournaments: Array<TournamentRecord>;
export let data: any;
```

**Features:**
- Display configured settings summary
- Show prize pool amount
- Show selected course
- Show tournament count
- Links to individual tournament settings pages
- "Generate Groups" button (calls server action)
- Preview of next steps
- Navigation to displays/work orders

### Step 7: Refactor Parent CreateTournaments.svelte

**Reduce to ~150-200 lines** - orchestration only

**State:**
```typescript
let currentStep = 1;
const totalSteps = 4;

// Completion tracking
let prizePoolConfigured = false;
let courseSelected = false;
let tournamentsCreated = false;
```

**Navigation:**
```typescript
function nextStep() {
  if (currentStep < totalSteps) {
    currentStep += 1;
  }
}

function prevStep() {
  if (currentStep > 1) {
    currentStep -= 1;
  }
}

function goToStep(step: number) {
  if (step >= 1 && step <= totalSteps) {
    currentStep = step;
  }
}
```

**Conditional Rendering:**
```svelte
<script>
  import StepIndicator from './create-tournaments/StepIndicator.svelte';
  import PrizePoolStep from './create-tournaments/prize-pool-step/+page.svelte';
  import CourseStep from './create-tournaments/course-step/+page.svelte';
  import TournamentStep from './create-tournaments/tournament-step/+page.svelte';
  import SummaryStep from './create-tournaments/summary-step/+page.svelte';

  export let data;

  let currentStep = 1;
  let selectedCourseId = data.courses?.[0]?.id || '';
  let season = 2026;
  let prizePoolAmount = 2000000;

  // Completion tracking
  $: completedSteps = [
    prizePoolConfigured ? 1 : 0,
    courseSelected ? 2 : 0,
    tournamentsCreated ? 3 : 0,
  ].filter(Boolean);

  // Callbacks
  function handlePrizePoolComplete(s: number, amount: number) {
    season = s;
    prizePoolAmount = amount;
    prizePoolConfigured = true;
    nextStep();
  }

  function handleCourseCreated(courseId: string) {
    selectedCourseId = courseId;
    courseSelected = true;
  }

  function handleTournamentCreated() {
    tournamentsCreated = true;
  }
</script>

<div class="container mx-auto p-6">
  <h1>Tournament Setup Wizard</h1>
  
  <StepIndicator 
    {currentStep} 
    {completedSteps}
    onStepClick={goToStep}
  />

  {#if currentStep === 1}
    <PrizePoolStep 
      {data} 
      onComplete={handlePrizePoolComplete}
    />
  {:else if currentStep === 2}
    <CourseStep 
      courses={data.courses}
      {selectedCourseId}
      onCourseCreated={handleCourseCreated}
      onCourseSelected={(id) => selectedCourseId = id}
    />
  {:else if currentStep === 3}
    <TournamentStep 
      tournaments={data.tournaments}
      courses={data.courses}
      {data}
      {selectedCourseId}
      {season}
      onTournamentCreated={handleTournamentCreated}
    />
  {:else if currentStep === 4}
    <SummaryStep 
      summary={{
        season,
        prizePool: prizePoolAmount,
        courseName: data.courses.find(c => c.id === selectedCourseId)?.name || '',
        tournamentsCreated: data.tournaments.filter(t => t.seasonId === season).length,
        totalTournaments: 6,
      }}
      tournaments={data.tournaments}
      {data}
    />
  {/if}

  <div class="flex justify-between mt-6">
    <button
      disabled={currentStep === 1}
      on:click={prevStep}
    >
      Previous
    </button>
    <button
      disabled={currentStep === totalSteps}
      on:click={nextStep}
    >
      Next
    </button>
  </div>
</div>
```

### Step 8: Update Routes (No Changes Required)

**File:** `frontend/src/routes/tournaments/+page.svelte`

No changes needed - still imports and uses:
```svelte
<CreateTournaments {data} />
```

## Verification Checklist

After implementation, verify:

- [ ] All 4 steps load independently in the wizard
- [ ] Navigation between steps works (next/prev buttons enable/disable correctly)
- [ ] Step indicator shows current step and completed steps
- [ ] Prize pool form submits and shows success/error states
- [ ] Course creation generates random data and saves correctly
- [ ] Course list displays existing courses with selection
- [ ] Tournament grid renders 6 forms with proper state management
- [ ] Individual tournament creation works
- [ ] Bulk "Create All" button creates multiple tournaments
- [ ] Tournament table sorts by all columns (name, date, course, season)
- [ ] Sort indicators display correctly (↑ ↓)
- [ ] Summary step displays all configured data
- [ ] No console errors or broken props flow
- [ ] All server actions still fire correctly via form submissions
- [ ] Form validations work (through enhance handlers)
- [ ] Loading states display during async operations

## Architecture Decisions

### State Locality
**Decision:** Each step manages its own form state (courseName, prizePoolSeason, etc.); parent only tracks `currentStep` and high-level completion flags.

**Rationale:** 
- Avoids prop drilling 25+ state variables through parent
- Makes steps independently testable
- Enables potential reuse of steps in other contexts
- Keeps related logic together

### Utilities Over Hooks
**Decision:** Extract sorting functions and form handlers as pure modules (not Svelte stores).

**Rationale:**
- Reusable across routes (scoring page also uses sorting)
- Easier to test in isolation
- No reactivity needed for pure functions
- Follows functional programming patterns

### Folder Structure
**Decision:** Steps live in `/create-tournaments/{step-name}/+page.svelte` with supporting components co-located.

**Rationale:**
- Keeps related logic together
- Clear hierarchy (parent → steps → sub-components)
- Avoids deeply nested complexity
- Easy to locate and navigate

### No Store Refactor
**Decision:** Keep existing stores (`$currentRole`) as-is; don't introduce new stores for wizard state.

**Rationale:**
- This refactor focuses on component layout, not global state
- Wizard state is ephemeral (only lives during setup flow)
- Adding stores would increase complexity for prototype use case
- Component state is sufficient for parent-child communication

### SvelteKit Naming Convention
**Decision:** Use `+page.svelte` for main step components (even though they're not routes).

**Rationale:**
- Signals "entry point" for that step
- Follows familiar SvelteKit pattern (even outside routes/)
- Makes it clear which file to open when debugging a step
- Alternative: Use `index.svelte` or step name directly (less clear)

## File Size Reduction Summary

| File | Before | After | Reduction |
|------|--------|-------|-----------|
| CreateTournaments.svelte | 925 lines | 150-200 lines | ~75-80% |
| Prize Pool Step | - | 60 lines | New |
| Course Step | - | 80 lines | New |
| Tournament Step | - | 100 lines | New |
| Summary Step | - | 80 lines | New |
| TournamentFormGrid | - | 60 lines | New |
| TournamentsTable | - | 90 lines | New |
| StepIndicator | - | 40 lines | New |
| Utilities (sorting, forms, validation) | - | 150 lines | New |

**Total:** ~925 lines → ~860 lines across 12+ focused files
- Slightly more code overall (overhead from component boundaries)
- Massive improvement in maintainability, testability, and navigability
- Each file now < 100 lines (highly readable)

## Next Steps After Implementation

1. **Test each step in isolation** - verify forms submit, validations work, data flows correctly
2. **Add TypeScript types** - create interfaces for props/state to catch errors early
3. **Extract tournament generation logic** - move `createAllTournaments()` to a utility module
4. **Consider adding tests** - unit tests for sorting/validation utilities, component tests for steps
5. **Refine error handling** - consistent error display patterns across all steps
6. **Add loading skeletons** - improve UX during async operations
7. **Document component APIs** - JSDoc comments for props/events on reusable components

## Potential Future Enhancements

- **Persistent wizard state** - save progress to localStorage in case user refreshes
- **Skip validation for prototype** - allow users to skip steps if needed
- **Dynamic tournament count** - allow users to choose how many tournaments to create
- **Drag-and-drop course holes** - visual editor for hole layout
- **Bulk import** - CSV/JSON import for tournaments
- **Preview mode** - show what will be created before submitting
- **Undo/redo** - allow users to go back and change previous steps without losing progress
