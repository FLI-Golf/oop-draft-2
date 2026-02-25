# Architecture

## Overview

The FLI Golf League platform is a three-layer system: a SvelteKit frontend, a PocketBase backend (SQLite), and a shared TypeScript domain model used by both.

```
┌─────────────────────────────────────────────┐
│  Browser                                    │
│  SvelteKit (SSR + client)                   │
│  Port 5173                                  │
│                                             │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐ │
│  │  Routes   │  │  Stores  │  │  Auth     │ │
│  │  /league  │  │  role.ts │  │  policy   │ │
│  │  /scoring │  │          │  │           │ │
│  │  /tourna… │  │          │  │           │ │
│  └────┬─────┘  └──────────┘  └───────────┘ │
│       │                                     │
│       │  /pb proxy                          │
└───────┼─────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────┐
│  PocketBase                                 │
│  Port 8090                                  │
│                                             │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐ │
│  │  REST API │  │  Auth    │  │  SQLite   │ │
│  │  /api/*   │  │  Rules   │  │  pb_data/ │ │
│  └──────────┘  └──────────┘  └───────────┘ │
│                                             │
│  pb_migrations/  (schema versioning)        │
│  pbapp/main.go   (custom Go app, planned)   │
└─────────────────────────────────────────────┘
        │
        │  imports
        ▼
┌─────────────────────────────────────────────┐
│  shared/                                    │
│  Domain models, scoring engines, services   │
│  Used by frontend at build time             │
│  Planned: used by Go hooks at runtime       │
└─────────────────────────────────────────────┘
```

## Layers

### Frontend (`frontend/`)

SvelteKit app with server-side rendering. Key directories:

| Path | Purpose |
|------|---------|
| `src/routes/` | Page routes: dashboard, league, scoring, tournaments, playoffs, displays, work-order |
| `src/lib/pb.ts` | PocketBase client — auto-detects base URL for local, Codespaces, and Gitpod environments |
| `src/lib/auth/policy.ts` | Capability-based authorization (`can(role, capability)`) |
| `src/lib/stores/role.ts` | Demo role switcher persisted to `localStorage` |
| `src/lib/components/` | UI components including shadcn-svelte primitives |
| `src/lib/server/pb.ts` | Server-side PocketBase client (uses `$env/dynamic/private`) |

The Vite dev server proxies `/pb` to `http://localhost:8090`, so the frontend can call PocketBase without CORS issues during development (configured in `vite.config.ts`).

### Backend (`backend/`)

PocketBase v0.24.2 with JavaScript migrations. Two ways to run it:

1. **`pb.sh`** — Downloads and runs the standalone PocketBase binary. Used for development.
2. **`pbapp/main.go`** — Custom Go app that embeds PocketBase with JSVM hooks, auto-migration, and custom routes. Intended for production.

The Go app adds:
- JSVM plugin for `pb_hooks/` and `pb_migrations/`
- Auto-migration in dev mode (when run via `go run`)
- Static file serving from `pb_public/`
- Extension point for custom Go endpoints (e.g., scoring calculations)

### Shared Domain (`shared/`)

TypeScript domain models published as `@oop-draft-2/shared` (workspace package). The frontend imports these directly.

**Domain objects:**

| Model | Purpose |
|-------|---------|
| `Tournament` | Tournament lifecycle: SETUP → IN_PROGRESS → COMPLETED → PLAYOFF_REQUIRED → FINALIZED |
| `TournamentSettings` | Format, tee times, group size, scoring model |
| `Course`, `CourseHole`, `Hole`, `HoleLayout` | Course structure and hole distances |
| `Player`, `Team`, `Group` | Player/team/group relationships |
| `Score`, `Round`, `RoundHole` | Score tracking per hole |
| `FantasyParticipant`, `FantasyDraft` | Fantasy draft system |
| `League` | League-level container |

**Scoring engines** (`shared/src/domain/scoring/`):

All engines implement the `ScoringEngine<Input>` interface:

| Engine | Model | Description |
|--------|-------|-------------|
| `StandardStrokeEngine` | Stroke play | Traditional stroke scoring |
| `CTHDistanceEngine` | Closest-to-hole | Distance-based scoring |
| `SuddenDeathEngine` | Sudden death | Playoff tiebreaker |

Engines are registered via `ScoringRegistry` and selected per tournament format.

**Services:**

`TournamentService` orchestrates the tournament lifecycle — completing regular rounds, detecting ties, creating playoff groups, and finalizing winners.

## Data Flow

### Score Entry

```
Scorekeeper UI → POST /api/collections/scores/records → SQLite
                                                          │
                                                          ▼
                                              ScoringEngine.scoreGroup()
                                                          │
                                                          ▼
                                              GroupScoreResult / standings
```

### Tournament Lifecycle

```
1. Admin creates tournament + settings + groups
2. Scorekeepers enter scores per hole per player
3. TournamentService.completeRegularRound() checks for ties
4. If tied → playoff (SuddenDeathEngine)
5. Winner determined → tournament finalized
```

### PocketBase URL Resolution

The frontend PocketBase client (`src/lib/pb.ts`) resolves the backend URL at runtime:

1. Check `VITE_POCKETBASE_URL` env var
2. In browser: detect Codespaces (`*.app.github.dev`) or Gitpod (`*.gitpod.dev`) and swap port to 8090
3. Fallback: `http://127.0.0.1:8090`

## Authentication & Authorization

Two layers:

1. **PocketBase rules** — Server-side access control on each collection (see `docs/POCKETBASE_RULES.md`)
2. **Frontend policy** — `can(role, capability)` function gates UI elements

Roles: `Admin`, `Scorekeeper`, `Pro`, `Basic User`, `Anonymous`

The `role` field on the `users` collection drives both layers. The frontend demo role switcher (`stores/role.ts`) allows testing different roles without re-authenticating.

## Key Design Decisions

**PocketBase over a custom API:** Fast iteration, built-in auth, migration support, and a path to Go hooks when performance matters.

**Shared domain package:** Domain logic lives outside both frontend and backend so it can be reused. Scoring engines and tournament lifecycle are pure TypeScript with no framework dependencies.

**Capability-based auth:** The `can(role, capability)` pattern decouples UI visibility from role names. Adding a new role means updating one switch statement, not every component.

**Migrations over auto-schema:** All schema changes are committed as JS migrations in `pb_migrations/`. The runtime database is gitignored. This ensures reproducible environments.
