<script lang="ts">
  import { page } from "$app/stores";
  import { currentRole, type DemoRole } from "$lib/stores/role";

  function setRole(role: DemoRole) {
    currentRole.set(role);
  }

  const navItems = [
    { href: "/", label: "Home", roles: ["Admin", "Scorekeeper", "Pro", "Basic User", "Anonymous"] },
    { href: "/league", label: "League", roles: ["Admin", "Scorekeeper", "Pro", "Basic User", "Anonymous"] },
    { href: "/dashboard", label: "Dashboard", roles: ["Admin", "Scorekeeper", "Pro", "Basic User", "Anonymous"] },
    { href: "/structure", label: "Structure", roles: ["Admin", "Scorekeeper", "Pro", "Basic User", "Anonymous"] },
    { href: "/scoring", label: "Scoring", roles: ["Admin", "Scorekeeper"] },
    { href: "/playoffs", label: "Playoffs", roles: ["Admin", "Scorekeeper"] },
    { href: "/tournaments", label: "Admin", roles: ["Admin"] },
  ];

  $: visibleNavItems = navItems.filter(item => 
    item.roles.includes($currentRole)
  );

  $: currentPath = $page.url.pathname;

  function getRoleColor(role: string): string {
    switch (role) {
      case "Admin": return "bg-purple-100 text-purple-700 border-purple-300";
      case "Scorekeeper": return "bg-amber-100 text-amber-700 border-amber-300";
      case "Pro": return "bg-blue-100 text-blue-700 border-blue-300";
      case "Basic User": return "bg-gray-100 text-gray-700 border-gray-300";
      default: return "bg-gray-50 text-gray-500 border-gray-200";
    }
  }

  $: roleValue = $currentRole;
</script>

<nav class="border-b bg-white sticky top-0 z-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6">
    <div class="flex items-center justify-between h-14">
      <!-- Logo / Brand -->
      <div class="flex items-center gap-6">
        <a href="/" class="font-bold text-lg">FLI Golf</a>
        
        <!-- Nav Links -->
        <div class="hidden sm:flex items-center gap-1">
          {#each visibleNavItems as item}
            <a
              href={item.href}
              class="px-3 py-2 rounded-md text-sm font-medium transition-colors {currentPath === item.href ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}"
            >
              {item.label}
            </a>
          {/each}
        </div>
      </div>

      <!-- Role Selector -->
      <div class="flex items-center gap-3">
        <span class="text-xs text-muted-foreground hidden sm:inline">Demo Role:</span>
        <div class="relative">
          <select
            class="appearance-none rounded-md border px-3 py-1.5 pr-8 text-sm font-medium cursor-pointer {getRoleColor(roleValue)}"
            value={roleValue}
            on:change={(e) => setRole(e.currentTarget.value as DemoRole)}
          >
            <option value="Anonymous">Anonymous</option>
            <option value="Basic User">Basic User</option>
            <option value="Pro">Pro</option>
            <option value="Scorekeeper">Scorekeeper</option>
            <option value="Admin">Admin</option>
          </select>
          <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile Nav -->
    <div class="sm:hidden pb-3 flex gap-1 overflow-x-auto">
      {#each visibleNavItems as item}
        <a
          href={item.href}
          class="px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap {currentPath === item.href ? 'bg-gray-100 text-gray-900' : 'text-gray-600'}"
        >
          {item.label}
        </a>
      {/each}
    </div>
  </div>
</nav>
