<script lang="ts">
  export type SelectOption = { value: string; label: string; disabled?: boolean };

  let {
    value = $bindable(""),
    options = [],
    placeholder = "Select an option",
    name,
    id,
    required = false,
    disabled = false,
    className = "",
    ...rest
  }: {
    value?: string;
    options?: SelectOption[];
    placeholder?: string;
    name?: string;
    id?: string;
    required?: boolean;
    disabled?: boolean;
    className?: string;
    [key: string]: any;
  } = $props();
</script>

<select
  {name}
  {id}
  {required}
  {disabled}
  bind:value
  class={`flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
  {...rest}
>
  {#if placeholder}
    <option value="" disabled>
      {placeholder}
    </option>
  {/if}

  {#each options as opt}
    <option value={opt.value} disabled={opt.disabled}>{opt.label}</option>
  {/each}
</select>
