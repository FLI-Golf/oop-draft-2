<script lang="ts">
  /**
   * CreateTournaments - Multi-step tournament setup wizard
   * Orchestrates the 4-step flow for creating tournaments
   */
  
  import { Button } from "$lib/components/ui/button";
  import StepIndicator from "./create-tournaments/StepIndicator.svelte";
  import PrizePoolStep from "./create-tournaments/prize-pool-step/+page.svelte";
  import CourseStep from "./create-tournaments/course-step/+page.svelte";
  import TournamentStep from "./create-tournaments/tournament-step/+page.svelte";
  import SummaryStep from "./create-tournaments/summary-step/+page.svelte";

  type SeasonSettings = {
    id: string;
    season: string;
    prizePool: number;
    distributed: boolean;
  };

  export let data: {
    courses: { id: string; name: string; baseHoleDistances?: number[] }[];
    tournaments: {
      id: string;
      name: string;
      date: string;
      course: string;
      seasonId?: string;
      expand?: { 
        course?: { name: string };
        seasonId?: { id: string; year: string; active: boolean };
      };
    }[];
    tournamentCountsBySeason: Record<string, number>;
    seasonSettingsMap: Record<string, SeasonSettings>;
    groupsExistBySeason: Record<string, boolean>;
  };

  // Multi-step wizard state
  let currentStep = 1;
  const totalSteps = 4;
  
  // Shared state across steps
  let selectedCourseId = data.courses?.[0]?.id ?? "";
  let season = "2026";
  let prizePoolAmount = 4000000;
  
  // Completion tracking
  let prizePoolConfigured = false;
  let courseSelected = !!selectedCourseId;
  let tournamentsCreated = false;
  
  $: completedSteps = [
    prizePoolConfigured ? 1 : 0,
    courseSelected ? 2 : 0,
    tournamentsCreated ? 3 : 0,
  ].filter(Boolean);
  
  // Navigation functions
  function nextStep() {
    if (currentStep < totalSteps) currentStep++;
  }

  function prevStep() {
    if (currentStep > 1) currentStep--;
  }

  function goToStep(step: number) {
    if (step >= 1 && step <= totalSteps) currentStep = step;
  }
  
  // Step callbacks
  function handlePrizePoolComplete(s: string, amount: number) {
    season = s;
    prizePoolAmount = amount;
    prizePoolConfigured = true;
  }

  function handleCourseCreated(courseId: string) {
    selectedCourseId = courseId;
    courseSelected = true;
  }

  function handleCourseSelected(courseId: string) {
    selectedCourseId = courseId;
    courseSelected = true;
  }

  function handleTournamentCreated() {
    tournamentsCreated = true;
  }
  
  // Computed summary data for step 4
  $: summaryData = {
    season,
    prizePool: prizePoolAmount,
    courseName: data.courses.find(c => c.id === selectedCourseId)?.name || 'FLI Stadium',
    tournamentsCreated: data.tournaments.filter(t => t.expand?.seasonId?.year === season).length,
    totalTournaments: 6,
  };
  
  // Step labels
  const stepLabels = [
    "Prize Pool",
    "Course",
    "Tournaments",
    "Summary"
  ];
</script>

<div class="space-y-6">
  <div class="flex items-start justify-between">
    <div class="space-y-1">
      <h1 class="text-3xl font-bold">Tournament Setup</h1>
      <p class="text-muted-foreground">
        Step {currentStep} of {totalSteps}: {stepLabels[currentStep - 1]}
      </p>
    </div>

    <Button variant="outline" class="-mt-1">
      <a href="/work-order" class="flex items-center gap-2">← Return to Work Order</a>
    </Button>
  </div>

  <!-- Step Progress Indicator -->
  <StepIndicator 
    {currentStep}
    {totalSteps}
    {stepLabels}
    {completedSteps}
    onStepClick={goToStep}
    allowNavigation={true}
  />

  <!-- Step 1: Prize Pool -->
  {#if currentStep === 1}
    <PrizePoolStep 
      {data}
      onComplete={handlePrizePoolComplete}
      onNext={nextStep}
    />
  {/if}

  <!-- Step 2: Course -->
  {#if currentStep === 2}
    <CourseStep 
      courses={data.courses}
      {selectedCourseId}
      onCourseCreated={handleCourseCreated}
      onCourseSelected={handleCourseSelected}
      onNext={nextStep}
    />
  {/if}

  <!-- Step 3: Tournaments -->
  {#if currentStep === 3}
    <TournamentStep 
      tournaments={data.tournaments}
      courses={data.courses}
      {selectedCourseId}
      {season}
      onTournamentCreated={handleTournamentCreated}
    />
  {/if}

  <!-- Step 4: Summary -->
  {#if currentStep === 4}
    <SummaryStep 
      summary={summaryData}
      tournaments={data.tournaments}
    />
  {/if}

  <!-- Navigation Buttons -->
  <div class="flex items-center justify-between pt-4">
    <Button
      variant="outline"
      onclick={prevStep}
      disabled={currentStep === 1}
    >
      ← Previous
    </Button>

    <span class="text-sm text-muted-foreground">
      Step {currentStep} of {totalSteps}
    </span>

    {#if currentStep === totalSteps}
      <a href="/displays" class="inline-flex">
        <Button variant="default">
          Complete & View Displays ✓
        </Button>
      </a>
    {:else}
      <Button
        onclick={nextStep}
        disabled={currentStep === totalSteps}
      >
        Next →
      </Button>
    {/if}
  </div>
</div>
