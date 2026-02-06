<script lang="ts">
  /**
   * StepIndicator - Reusable progress indicator for multi-step workflows
   * Shows current step, completed steps, and allows navigation
   */
  
  export let currentStep: number = 1;
  export let totalSteps: number = 4;
  export let stepLabels: string[] = ['Prize Pool', 'Course', 'Tournaments', 'Summary'];
  export let onStepClick: (step: number) => void = () => {};
  export let completedSteps: number[] = [];
  export let allowNavigation: boolean = true;
  
  function handleStepClick(step: number) {
    if (allowNavigation) {
      onStepClick(step);
    }
  }
  
  function isCompleted(step: number): boolean {
    return completedSteps.includes(step) || currentStep > step;
  }
</script>

<div class="flex items-center justify-between mb-8">
  {#each Array(totalSteps) as _, i}
    {@const stepNum = i + 1}
    {@const isActive = currentStep === stepNum}
    {@const isDone = isCompleted(stepNum)}
    
    <button
      type="button"
      class="flex flex-col items-center gap-1 group"
      class:cursor-pointer={allowNavigation}
      class:cursor-default={!allowNavigation}
      onclick={() => handleStepClick(stepNum)}
      disabled={!allowNavigation}
    >
      <div
        class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors
          {isActive
            ? 'bg-emerald-600 text-white'
            : isDone
              ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-600'
              : 'bg-gray-100 text-gray-500 border border-gray-300'}"
      >
        {#if isDone && !isActive}
          ✓
        {:else}
          {stepNum}
        {/if}
      </div>
      <span class="text-xs text-muted-foreground hidden sm:block">
        {stepLabels[i] || `Step ${stepNum}`}
      </span>
    </button>
    
    {#if i < totalSteps - 1}
      <div class="flex-1 h-1 mx-2 {isDone ? 'bg-emerald-600' : 'bg-gray-200'} transition-colors"></div>
    {/if}
  {/each}
</div>
