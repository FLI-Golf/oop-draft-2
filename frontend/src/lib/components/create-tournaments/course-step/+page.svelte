<script lang="ts">
  /**
   * Course Step - Create and select courses
   * Step 2 of tournament setup wizard
   */
  
  import { enhance } from '$app/forms';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import CourseList from './CourseList.svelte';
  
  export let courses: Array<{ id: string; name: string; baseHoleDistances?: number[] }> = [];
  export let selectedCourseId: string = '';
  export let onCourseCreated: (courseId: string) => void = () => {};
  export let onCourseSelected: (courseId: string) => void = () => {};
  export let onNext: () => void = () => {};
  
  let courseName = '';
  let baseHoleDistances = '';
  let courseStatus = '';
  let courseError = '';
  let isGenerating = false;
  let isSubmitting = false;
  
  /**
   * Generate course with default name and random hole distances (250-400 yards)
   */
  function generateCourse() {
    isGenerating = true;
    courseName = 'FLI Stadium';
    const distances = Array.from({ length: 9 }, () => 
      Math.floor(Math.random() * 151) + 250
    );
    baseHoleDistances = distances.join(',');
    setTimeout(() => {
      isGenerating = false;
    }, 100);
  }
  
  function handleCourseSelect(courseId: string) {
    onCourseSelected(courseId);
  }
</script>

<Card>
  <CardHeader>
    <CardTitle>Step 2: Create Course</CardTitle>
    <p class="text-sm text-muted-foreground">
      Courses define the 9-hole layout with base distances. Create a course first, 
      then use it when creating tournaments.
    </p>
  </CardHeader>
  <CardContent class="space-y-4">
    {#if courseStatus}
      <p class="text-sm text-emerald-600">{courseStatus}</p>
    {/if}
    {#if courseError}
      <p class="text-sm text-red-600">{courseError}</p>
    {/if}

    <form
      method="POST"
      action="?/createCourse"
      use:enhance={() => {
        isSubmitting = true;
        return async ({ result, update }) => {
          if (result.type === 'success') {
            courseStatus = 'Course created ✅';
            courseError = '';
            
            // Get the new course ID from result if available
            const newCourseId = (result.data as Record<string, any>)?.courseId || courses[courses.length - 1]?.id || '';
            
            // Clear form
            courseName = '';
            baseHoleDistances = '';
            isSubmitting = false;
            
            // Notify parent and auto-select the new course
            if (newCourseId) {
              onCourseCreated(newCourseId);
              onCourseSelected(newCourseId);
            }
            
            // Auto-advance after short delay
            setTimeout(() => {
              onNext();
            }, 500);
          } else if (result.type === 'failure') {
            courseStatus = '';
            const data = result.data as Record<string, any>;
            courseError = data?.courseError || data?.error || 'Failed to create course.';
            isSubmitting = false;
          } else if (result.type === 'error') {
            courseStatus = '';
            courseError = (result.error as Record<string, any>)?.message || 'Unexpected error occurred.';
            isSubmitting = false;
          }
          await update();
        };
      }}
    >
      <div class="grid gap-3 sm:grid-cols-2">
        <div class="space-y-1">
          <label class="text-xs text-muted-foreground" for="courseName">
            Course name
          </label>
          <Input 
            id="courseName" 
            name="courseName" 
            bind:value={courseName} 
            placeholder="FLI Stadium" 
            required 
          />
        </div>

        <div class="space-y-1">
          <label class="text-xs text-muted-foreground" for="baseHoleDistances">
            Base hole distances (9 numbers, comma-separated)
          </label>
          <Input
            id="baseHoleDistances"
            name="baseHoleDistances"
            bind:value={baseHoleDistances}
            placeholder="310,295,340,265,360,315,285,370,300"
            required
          />
        </div>
      </div>

      <!-- Generate button for course name and hole distances -->
      <div class="mt-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onclick={generateCourse}
          disabled={isGenerating || isSubmitting}
        >
          {isGenerating ? 'Generating...' : 'Generate Course'}
        </Button>
      </div>

      <div class="mt-4">
        <Button 
          type="submit" 
          disabled={!courseName || !baseHoleDistances || isSubmitting}
        >
          {isSubmitting ? 'Creating...' : 'Create Course'}
        </Button>
      </div>
    </form>

    {#if courses.length > 0}
      <CourseList 
        {courses}
        {selectedCourseId}
        onSelect={handleCourseSelect}
      />
    {/if}
  </CardContent>
</Card>
