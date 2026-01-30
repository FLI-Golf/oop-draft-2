<!-- frontend/src/routes/work-order/+page.svelte -->
<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "$lib/components/ui/card";
  import { onMount } from "svelte";

  type Task = { id: string; text: string };
  type Section = { id: string; title: string; description?: string; tasks: Task[] };

  const STORAGE_KEY = "fli:work-order:v1";

  const sections: Section[] = [
    {
      id: "overview",
      title: "🧩 Project Overview",
      description:
        "Build a responsive website + companion app experience for the FLI Golf League, powered by PocketBase. Focus: league info, live scoring + stats, fantasy gameplay, media, merch, and admin tools for staff.",
      tasks: [
        { id: "ov-1", text: "Confirm season structure (teams, tournaments, venues, scoring cadence)" },
        { id: "ov-2", text: "Define content model in PocketBase (teams, players, tournaments, courses, scores, media, merch)" },
        { id: "ov-3", text: "Define user roles + permissions (anonymous / authenticated / scorekeeper / admin)" },
        { id: "ov-4", text: "Confirm fantasy rules + points system (v1 scope)" }
      ]
    },
    {
      id: "roles",
      title: "👥 User Types & Permissions",
      description: "All features should map to one of these four roles.",
      tasks: [
        { id: "r-1", text: "Anonymous: browse league info, schedule, teams/players, news/media, merch, limited fantasy previews" },
        { id: "r-2", text: "Authenticated: fantasy participation, favorites, profile/avatar (optional), history" },
        { id: "r-3", text: "Scorekeeper: enter/update scores, validate rounds/holes, limited admin UI" },
        { id: "r-4", text: "Admin: full CRUD, overrides, content scheduling, user management, audits" }
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
        { id: "a-1", text: "Score entry UI for scorekeepers (tournament → round → hole-by-hole)" },
        { id: "a-2", text: "Player/team stat entry & editing" },
        { id: "a-3", text: "Fantasy scoring override controls (admin only)" },
        { id: "a-4", text: "Media upload + content scheduling" },
        { id: "a-5", text: "Audit-friendly logging (who changed what + when)" }
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
        { id: "t-1", text: "Frontend: SvelteKit + Tailwind + shadcn-svelte UI primitives" },
        { id: "t-2", text: "Backend: PocketBase (collections, auth, rules, migrations)" },
        { id: "t-3", text: "Auth: PocketBase auth; roles via PB auth model / custom fields / rules" },
        { id: "t-4", text: "Data access: server load/actions for secure operations; role-based UI rendering" },
        { id: "t-5", text: "Future: PocketBase Go hooks for validations + derived data to shrink TS code" }
      ]
    },
    {
      id: "timeline",
      title: "📆 Timeline / Phases (Prototype-Friendly)",
      tasks: [
        { id: "p-1", text: "Phase 1: Data model + admin score entry flows (core prototype)" },
        { id: "p-2", text: "Phase 2: Public league pages + basic media hub" },
        { id: "p-3", text: "Phase 3: Fantasy v1 (picks + leaderboard) tied to real score data" },
        { id: "p-4", text: "Phase 4: Hardening: rules, role permissions, audits, seed data" }
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

  let checked: Record<string, boolean> = {};

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(checked));
    } catch {
      // ignore (private mode, quota, etc.)
    }
  }

  function toggle(id: string) {
    checked = { ...checked, [id]: !checked[id] };
    save();
  }

  function resetAll() {
    checked = {};
    save();
  }

  function completionFor(section: Section) {
    const total = section.tasks.length;
    const done = section.tasks.reduce((acc, t) => acc + (checked[t.id] ? 1 : 0), 0);
    return { done, total };
  }

  onMount(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) checked = JSON.parse(raw);
    } catch {
      checked = {};
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

  <Card>
    <CardHeader>
      <CardTitle>Client & Contacts</CardTitle>
      <CardDescription>Primary project contacts.</CardDescription>
    </CardHeader>
    <CardContent class="grid gap-4 sm:grid-cols-2 text-sm">
      <div class="space-y-1">
        <div><span class="font-medium">Client:</span> FLI Golf League</div>
        <div><span class="font-medium">IT Director:</span> Dustin Dinsmore</div>
      </div>
      <div class="space-y-1">
        <div class="font-medium">Primary Contacts</div>
        <div class="text-muted-foreground">Andrew Panza (CEO / Founder) — 716-572-8319 andrew@fligolf.com</div>
        <div class="text-muted-foreground">Dustin Dinsmore (IT Director / CTO) — 626-222-3107 dustin@fligolf.com</div>
      </div>
    </CardContent>
  </Card>

  {#each sections as s}
    {@const prog = completionFor(s)}
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center justify-between gap-3">
          <span>{s.title}</span>
          <span class="text-sm text-muted-foreground">{prog.done}/{prog.total}</span>
        </CardTitle>
        {#if s.description}
          <CardDescription>{s.description}</CardDescription>
        {/if}
      </CardHeader>

      <CardContent class="space-y-2">
        {#each s.tasks as t}
          <label class="flex items-start gap-3 rounded-md border p-3 hover:bg-muted/40 cursor-pointer">
            <input
              type="checkbox"
              class="mt-1 h-4 w-4"
              checked={!!checked[t.id]}
              on:change={() => toggle(t.id)}
            />
          <div class="text-sm">
            <div class="leading-snug">
              {t.text}
            </div>
          </div>
          </label>
        {/each}
      </CardContent>
    </Card>
  {/each}

  <div class="text-xs text-muted-foreground">
    Checklist state is stored in <span class="font-mono">localStorage</span> on this device. For team-wide tracking later,
    store task completion in PocketBase per user/role.
  </div>
</div>

<style>
  /* Completed task: green background + check indicator */
  label:has(input:checked) {
    background-color: hsl(142.1 70.6% 45.3% / 0.15); /* soft green */
    border-color: hsl(142.1 70.6% 45.3%);
  }

  /* Add green check icon on the left */
  label:has(input:checked)::before {
    content: "✔";
    color: hsl(142.1 70.6% 45.3%);
    font-weight: 700;
    margin-top: 2px;
  }

  /* Layout fix so the check aligns nicely */
  label {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
  }

  /* Keep text fully readable */
  label:has(input:checked) div {
    color: inherit;
  }

  /* Optional: soften unchecked hover */
  label:hover {
    background-color: hsl(0 0% 0% / 0.03);
  }
</style>

