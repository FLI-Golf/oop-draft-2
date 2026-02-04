<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import SectionCard from "$lib/components/work-order/SectionCard.svelte";
  import ContactsCard from "$lib/components/work-order/ContactsCard.svelte";
  import { onMount } from "svelte";

  type Task = { id: string; text: string };
  type Section = { id: string; title: string; description?: string; tasks: Task[] };

  const STORAGE_KEY = "fli:work-order:v1";
  const COLLAPSE_KEY = "fli:work-order:collapsed:v1";
  const CONTACTS_ID = "contacts";

  const sections: Section[] = [
    {
      id: "overview",
      title: "🧩 Project Overview",
      description:
        "Build a responsive website + companion app experience for the FLI Golf League, powered by PocketBase. Focus: league info, live scoring + stats, fantasy gameplay, media, merch, and admin tools for staff.",
      tasks: [
        { id: "ov-1", text: "✅ Confirm season structure (teams, tournaments, venues, scoring cadence)" },
        { id: "ov-2", text: "✅ Define content model in PocketBase (teams, players, tournaments, courses, scores, media, merch)" },
        { id: "ov-3", text: "✅ Define user roles + permissions (anonymous / authenticated / scorekeeper / admin)" },
        { id: "ov-4", text: "Confirm fantasy rules + points system (v1 scope)" }
      ]
    },
    {
    id: "roles",
    title: "👥 User Roles & Capabilities (Demo)",
    description:
      "This demo uses a centralized policy model to illustrate role-based capabilities. Not all capabilities are fully implemented, as this app is not intended for production.",
    tasks: [
      {
        id: "r-1",
        text:
          "✅ Basic User: browse league info, schedules, tournaments, courses, teams/players, read-only access to public data"
      },
      {
        id: "r-2",
        text:
          "✅ Pro: read-only access plus limited interactions (e.g. posting comments or feedback — capability shown in policy but not fully implemented)"
      },
      {
        id: "r-3",
        text:
          "✅ Scorekeeper: enter and update scores, validate rounds/holes, access scorekeeping tools"
      },
      {
        id: "r-4",
        text:
          "✅ Admin: full CRUD access, tournament/course management, overrides, user role assignment, system configuration"
      }
    ]
  },
    {
      id: "website-home",
      title: "🖥️ Website — Homepage",
      tasks: [
        { id: "wh-1", text: "Hero banner (video or rotating imagery)" },
        { id: "wh-2", text: "Next tournament countdown" },
        { id: "wh-3", text: "Featured players/teams" },
        { id: "wh-4", text: "Fantasy leaderboard preview (public)" },
        { id: "wh-5", text: "League news carousel" },
        { id: "wh-6", text: "Shop promo strip + sponsor logos" }
      ]
    },
    {
      id: "website-league",
      title: "🗺️ Website — League Information",
      tasks: [
        { id: "wl-1", text: "Season schedule page (dates, venues, map)" },
        { id: "wl-2", text: "Tournament pages: matchups, results, highlights, MVPs" },
        { id: "wl-3", text: "Course pages: interactive map placeholder + scoring summary + key stats" },
        { id: "wl-4", text: "Teams page: logos, bios, rosters, standings" },
        { id: "wl-5", text: "Player roster: sortable filters (team, wins, stats) + player profiles" }
      ]
    },
    {
      id: "fantasy-web",
      title: "🎯 Fantasy Platform — Web Companion",
      tasks: [
        { id: "fw-1", text: "Account system (PocketBase auth) for authenticated fantasy users" },
        { id: "fw-2", text: "Weekly/tournament pick interface (points cap / constraints)" },
        { id: "fw-3", text: "Live / near-live leaderboard tied to scores" },
        { id: "fw-4", text: "Season standings + historical results per user" }
      ]
    },
    {
      id: "media",
      title: "📰 News / Media Hub",
      tasks: [
        { id: "m-1", text: "Press releases + league news posts" },
        { id: "m-2", text: "Highlights/interviews/BTS video sections" },
        { id: "m-3", text: "Searchable archive (basic filters v1)" },
        { id: "m-4", text: "Newsletter signup integration (provider TBD)" }
      ]
    },
    {
      id: "merch",
      title: "🛍️ Merch (No WordPress)",
      description:
        "Current direction: do not rely on WordPress/WooCommerce for this prototype. Options: simple PocketBase product catalog now, integrate e-commerce later.",
      tasks: [
        { id: "s-1", text: "PocketBase products collection (name, price, images, sizes, inventory flag)" },
        { id: "s-2", text: "Public merch listing page + product detail page (prototype)" },
        { id: "s-3", text: "Checkout approach decision (later): Stripe checkout, Shopify, or external link" }
      ]
    },
    {
      id: "admin-tools",
      title: "🛠️ Backend / Admin Tools",
      tasks: [
        { id: "a-1", text: "✅ Season Prize Pool configuration (Step 1 in tournament workflow)" },
        { id: "a-2", text: "✅ Course creation with 9-hole layouts and base distances" },
        { id: "a-3", text: "✅ Tournament creation with season, date, and course assignment" },
        { id: "a-4", text: "✅ Tournament settings (tee times, intervals, starting hole, format)" },
        { id: "a-5", text: "✅ Group generation with automatic tee time assignment" },
        { id: "a-6", text: "✅ Tournaments Dashboard - view tee sheets, groups, and schedules" },
        { id: "a-7", text: "✅ Live Scoring UI - 18-hole scoring (front 9 + back 9) with +/- buttons" },
        { id: "a-8", text: "✅ All 4 players per hole scoring interface" },
        { id: "a-9", text: "✅ Scorecard summary with real-time totals" },
        { id: "a-10", text: "✅ Group status tracking (pending → in_progress → complete)" },
        { id: "a-11", text: "✅ Playoff system for ties (closest-to-hole competition)" },
        { id: "a-12", text: "✅ Playoff distance entry and winner determination" },
        { id: "a-13", text: "✅ League info page (teams, players, standings, upcoming events)" },
        { id: "a-14", text: "✅ Role-based navigation (Admin, Scorekeeper, Pro, Basic User, Anonymous)" },
        { id: "a-15", text: "✅ Demo role selector in navbar for prototype testing" },
        { id: "a-16", text: "Player/team stat entry & editing" },
        { id: "a-17", text: "Fantasy scoring override controls (admin only)" },
        { id: "a-18", text: "Media upload + content scheduling" },
        { id: "a-19", text: "Audit-friendly logging (who changed what + when)" }
      ]
    },
    {
      id: "mobile",
      title: "📱 Mobile App Requirements (Prototype Scope)",
      description:
        "This repo can remain web-first, but structure data + endpoints so a mobile client can be added later.",
      tasks: [
        { id: "mb-1", text: "Fantasy core: picks, caps, live leaderboard, season points" },
        { id: "mb-2", text: "Live scores & stats: scorecards, leaderboards, per-hole highlights" },
        { id: "mb-3", text: "Media & replays: highlights + past events" },
        { id: "mb-4", text: "Push notifications plan (later): roster lock, live scoring updates" }
      ]
    },
    {
      id: "tech",
      title: "🧱 Technical Requirements (Updated)",
      tasks: [
        { id: "t-1", text: "✅ Frontend: SvelteKit + Tailwind + shadcn-svelte UI primitives" },
        { id: "t-2", text: "✅ Backend: PocketBase (collections, auth, rules, migrations)" },
        { id: "t-3", text: "✅ Auth: PocketBase auth; roles via PB auth model / custom fields / rules" },
        { id: "t-4", text: "✅ Data access: server load/actions for secure operations; role-based UI rendering" },
        { id: "t-5", text: "Future: PocketBase Go hooks for validations + derived data to shrink TS code" }
      ]
    },
    {
      id: "timeline",
      title: "📆 Timeline / Phases (Prototype-Friendly)",
      tasks: [
        { id: "p-1", text: "✅ Phase 1: Data model + admin score entry flows (core prototype)" },
        { id: "p-2", text: "✅ Phase 2: Public league pages + basic media hub" },
        { id: "p-3", text: "Phase 3: Fantasy v1 (picks + leaderboard) tied to real score data" },
        { id: "p-4", text: "✅ Phase 4: Hardening: rules, role permissions, audits, seed data" }
      ]
    },
    {
      id: "security",
      title: "🔐 Security / Legal",
      tasks: [
        { id: "sec-1", text: "HTTPS/SSL in deployment" },
        { id: "sec-2", text: "Privacy policy + basic compliance posture (GDPR-style principles)" },
        { id: "sec-3", text: "Fantasy disclaimers (no monetary betting in prototype)" },
        { id: "sec-4", text: "Least-privilege access rules in PocketBase" }
      ]
    },
    {
      id: "files",
      title: "📎 Files & Reference Materials Needed",
      tasks: [
        { id: "f-1", text: "League logos + team branding kits" },
        { id: "f-2", text: "Player images + bios" },
        { id: "f-3", text: "Tournament schedule + structure" },
        { id: "f-4", text: "Fantasy point system (v1)" },
        { id: "f-5", text: "Merch product list + images (if prototyping merch pages)" }
      ]
    }
  ];

  // ✅ Default: contacts collapsed; first section open; rest collapsed
  const defaultCollapsed: Record<string, boolean> = {
    [CONTACTS_ID]: true,
    ...Object.fromEntries(sections.map((s, i) => [s.id, i !== 0]))
  };

  let checked: Record<string, boolean> = {};
  let collapsed: Record<string, boolean> = { ...defaultCollapsed };

  function saveChecked() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(checked));
    } catch {}
  }

  function saveCollapsed() {
    try {
      localStorage.setItem(COLLAPSE_KEY, JSON.stringify(collapsed));
    } catch {}
  }

  function toggleTask(id: string) {
    checked = { ...checked, [id]: !checked[id] };
    saveChecked();
  }

  function toggleCard(id: string) {
    collapsed = { ...collapsed, [id]: !collapsed[id] };
    saveCollapsed();
  }

  function resetAll() {
    checked = {};
    saveChecked();
  }

  function completionForTasks(tasks: Task[]) {
    const total = tasks.length;
    const done = tasks.reduce((acc, t) => acc + (checked[t.id] ? 1 : 0), 0);
    return { done, total };
  }

  onMount(() => {
    // Restore checklist
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) checked = JSON.parse(raw);
    } catch {
      checked = {};
    }

    // Restore collapsed state; if none, keep defaults and persist them once
    try {
      const raw = localStorage.getItem(COLLAPSE_KEY);
      if (raw) {
        collapsed = JSON.parse(raw);
      } else {
        collapsed = { ...defaultCollapsed };
        saveCollapsed();
      }
    } catch {
      collapsed = { ...defaultCollapsed };
    }
  });
</script>

<div class="p-8 max-w-5xl mx-auto space-y-6">
  <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div class="space-y-2">
      <h1 class="text-3xl sm:text-4xl font-bold">✅ FLI Golf League — Work Order (Prototype)</h1>

      <div class="flex flex-wrap items-center gap-2">
        <span class="rounded-full border px-2 py-1 text-xs text-muted-foreground">SvelteKit</span>
        <span class="rounded-full border px-2 py-1 text-xs text-muted-foreground">PocketBase</span>
        <span class="rounded-full border px-2 py-1 text-xs text-muted-foreground">Roles + Admin Tools</span>
      </div>

      <p class="text-sm text-muted-foreground">
        Date Issued: <span class="italic">[Insert Date]</span>
      </p>

      <p class="text-muted-foreground">
        Internal spec provided by leadership. This page is a living checklist for implementation and handoff.
      </p>
    </div>

    <div class="flex gap-2">
      <a href="/"><Button variant="outline">Home</Button></a>
      <a href="/tournaments"><Button>Admin Tools</Button></a>
      <Button variant="outline" on:click={resetAll}>Reset checklist</Button>
    </div>
  </div>

  <!-- Contacts Card -->
  <ContactsCard
    id={CONTACTS_ID}
    collapsed={!!collapsed[CONTACTS_ID]}
    onToggle={() => toggleCard(CONTACTS_ID)}
  />

  <!-- Sections -->
  {#each sections as s (s.id)}
    {@const prog = completionForTasks(s.tasks)}
    <SectionCard
      section={s}
      collapsed={!!collapsed[s.id]}
      prog={prog}
      checked={checked}
      onToggle={() => toggleCard(s.id)}
      onToggleTask={toggleTask}
    />
  {/each}

  <div class="text-xs text-muted-foreground">
    Checklist state is stored in <span class="font-mono">localStorage</span> on this device. For team-wide tracking later,
    store task completion in PocketBase per user/role.
  </div>
</div>

<style>
  /* Completed task: green background + check indicator */
  label:has(input:checked) {
    background-color: hsl(142.1 70.6% 45.3% / 0.15);
    border-color: hsl(142.1 70.6% 45.3%);
  }

  label:has(input:checked)::before {
    content: "✔";
    color: hsl(142.1 70.6% 45.3%);
    font-weight: 700;
    margin-top: 2px;
  }

  label {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
  }

  label:has(input:checked) div {
    color: inherit;
  }

  label:hover {
    background-color: hsl(0 0% 0% / 0.03);
  }
</style>
