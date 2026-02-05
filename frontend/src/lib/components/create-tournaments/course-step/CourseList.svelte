<script lang="ts">
  /**
   * CourseList - Display and select existing courses
   */
  
  export let courses: Array<{ id: string; name: string; baseHoleDistances?: number[] }> = [];
  export let selectedCourseId: string = '';
  export let onSelect: (courseId: string) => void = () => {};
  
  function handleSelect(courseId: string) {
    onSelect(courseId);
  }
</script>

<div class="mt-6 pt-4 border-t">
  <h4 class="text-sm font-medium mb-3">Existing Courses</h4>
  
  {#if courses.length === 0}
    <p class="text-sm text-muted-foreground">No courses created yet.</p>
  {:else}
    <div class="space-y-2">
      {#each courses as course}
        <label
          class="flex items-center gap-3 p-3 rounded-md border hover:bg-gray-50 transition cursor-pointer
            {selectedCourseId === course.id ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'}"
        >
          <input
            type="radio"
            name="selectedCourse"
            value={course.id}
            checked={selectedCourseId === course.id}
            onchange={() => handleSelect(course.id)}
            class="w-4 h-4 text-emerald-600"
          />
          <div class="flex-1">
            <div class="font-medium text-sm">{course.name}</div>
            {#if course.baseHoleDistances}
              <div class="text-xs text-muted-foreground mt-1">
                {course.baseHoleDistances.join(', ')} yards
              </div>
            {/if}
          </div>
          {#if selectedCourseId === course.id}
            <span class="text-emerald-600 text-sm">✓ Selected</span>
          {/if}
        </label>
      {/each}
    </div>
  {/if}
</div>
