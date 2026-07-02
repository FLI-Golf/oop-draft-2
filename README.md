# FLI Golf League — Scoring App Prototype

Internal prototype for the **FLI Golf League** scoring app, admin tools, and future mobile app.

This repository is treated as **FliScore**: the scoring-side system responsible for standings, ties, playoff context, submission state, and outbound result payloads.

---

## FliHub and FliScore High-Level Ownership

## Purpose

This document defines which app owns which responsibilities at a high level.

Use this as the decision rule when adding features:
- If a feature concerns scoring truth, it belongs in FliScore.
- If a feature concerns money truth, approvals, and payout accounting, it belongs in FliHub.

## One-Sentence Split

- FliScore decides who finished where and why.
- FliHub decides what gets paid, when, and under what controls.

## Ownership by Domain

### FliScore Owns

- Tournament scoring workflow
- Tee sheets, groups, and live score capture
- Order of finish, tie states, and playoff resolution details
- Manual score corrections with scoring context
- Submission state (`partial`, `unofficial`, `final`) for competitive data
- Outbound result payload creation for FliHub

### FliHub Owns

- Canonical money fields for tournament payout accounting
- Prize parity checks and payout eligibility gates
- Approval workflows and policy enforcement
- Pro payments, franchise payouts, and work order generation
- Idempotent payout execution and audit logs
- Financial reporting, reconciliation, and payout status lifecycle

### Shared/Coordinated Areas

- Team and pro identity mapping (`pro`, `franchise`, `tournament` IDs)
- Submission contracts and schema versioning
- Error contracts for blocked runs
- Operational alerts for mismatch and failed payout runs

## System Boundaries (What Must Not Cross)

### Keep Out of FliScore

- Final payout accounting decisions
- Approval decisions for payout release
- Work order creation
- Independent prize pool authority

### Keep Out of FliHub

- Match/group scoring UI behavior
- Tie-break and playoff competitive adjudication logic
- Score-entry workflow design

## Interaction Model

1. FliScore prepares standings payload from scoring truth.
2. FliScore sends payload and submission metadata to FliHub.
3. FliHub validates identities, structure, and money parity.
4. FliHub blocks or executes payout generation.
5. FliHub returns run status and diagnostics.
6. FliScore displays sync outcome for operator action.

## Source-of-Truth Policy

- Competitive truth source: FliScore
  - placements, ties, playoff details, submission status
- Financial truth source: FliHub
  - payout amounts, approval state, paid/pending/blocked status

Temporary mirror policy:
- If a season prize pool exists in both systems, the non-canonical copy is validation-only.
- On mismatch, payout execution must fail closed.

## Responsibility Matrix

| Capability | FliScore | FliHub |
|---|---|---|
| Live score capture | Owner | Consumer |
| Final standings | Owner | Consumer |
| Tie/playoff narrative | Owner | Consumer |
| Result payload assembly | Owner | Validate/consume |
| Prize parity validation | Input provider | Owner |
| Payout calculation and creation | No | Owner |
| Approval workflow | No | Owner |
| Work orders | No | Owner |
| Payment audit log | No | Owner |
| Operator payout diagnostics | Display | Owner/source |

## Integration Contracts to Maintain

- Deterministic idempotency key per tournament + run type
- Validation before writes
- Atomic write behavior (all-or-nothing payout generation)
- Explicit blocked-state diagnostics
- Manual override provenance (`reason`, `approvedBy`, `approvedAt`)

## Decision Heuristics for New Features

Use these quick tests:

1. If wrong behavior would change leaderboard truth, implement in FliScore.
2. If wrong behavior would move money incorrectly, implement in FliHub.
3. If the feature touches both, keep logic in one app and expose results over contract boundaries.
4. Avoid dual-write rules for payout-critical values.

## Operating Principle

Optimize each app for its core truth:
- FliScore is optimized for competitive accuracy.
- FliHub is optimized for financial control and auditability.

That split reduces risk, simplifies debugging, and keeps payout governance reliable as volume grows.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | SvelteKit, TypeScript, Tailwind CSS, shadcn-svelte |
| Backend | PocketBase v0.24.2 (SQLite, schema migrations, Go hooks planned) |
| Auth | PocketBase authentication with role-based access |

---

## Project Structure

```text
frontend/             SvelteKit app (port 5173)
  src/
    routes/           Pages and API routes
    lib/components/   UI components

backend/
  pb.sh              PocketBase startup script (downloads binary if needed)
  pb-migrate.sh      Migration runner
  pbapp/             Custom PocketBase Go app (main.go)
  pb_migrations/     Schema migrations (tracked in git)
  pb_data/           Runtime database (gitignored)
  seed_data/         Database seed scripts
  .env               Active environment config
  .env.ona           Ona/Gitpod environment template
  .env.codespace     GitHub Codespaces template
  .env.secrets       Admin credentials (PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD)

shared/              Shared domain models (Tournament, Course, etc.)
scripts/
  ona-setup.sh       Automated setup script
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Go (for the PocketBase Go app)

The dev container (`.devcontainer/`) installs all of these automatically.

---

### Step 1: Install Dependencies

```bash
pnpm install
```

The `postCreateCommand` in `devcontainer.json` runs this automatically, along with `go mod download` for the Go backend.

Backend seed scripts need their own dependencies:

```bash
cd backend && npm install pocketbase dotenv && cd ..
```

---

### Step 2: Set Up Environment

Copy the appropriate env template for your environment:

```bash
# Ona / Gitpod
cp backend/.env.ona backend/.env

# GitHub Codespaces
cp backend/.env.codespace backend/.env
```

The `.env` file configures PocketBase's listen address, data directory, CORS origins, and hooks.

---

### Step 3: Start PocketBase

```bash
bash backend/pb.sh
```

This script:
- Downloads the PocketBase v0.24.2 binary to `backend/bin/` if not present
- Loads `backend/.env`
- Starts PocketBase on `0.0.0.0:8090`

> **Data directory note:** `pb.sh` resolves `PB_DATA_DIR` relative to the repo root. The default is `./pb_data` (i.e., `<repo>/pb_data`). Keep this in mind when running CLI commands — always pass `--dir pb_data` from the repo root.

---

### Step 4: Create Superuser

Admin credentials are stored in `backend/.env.secrets`:

```
PB_ADMIN_EMAIL=<email>
PB_ADMIN_PASSWORD=<password>
```

Stop PocketBase, then from the repo root:

```bash
backend/bin/pocketbase superuser upsert '<email>' '<password>' --dir pb_data
```

> The `--dir` must point to the same data directory PocketBase uses. Since `pb.sh` uses `./pb_data` from the repo root, use `--dir pb_data` when running from the repo root.

Restart PocketBase after creating the superuser.

---

### Step 5: Run Migrations

Stop PocketBase first, then from the repo root:

```bash
backend/bin/pocketbase migrate up --dir pb_data --migrationsDir backend/pb_migrations
```

This applies all 25 migrations, creating these collections:

`users`, `courses`, `tournaments`, `players`, `teams`, `tournament_settings`, `groups`, `seasons`, `season_settings`, `prize_distributions`, `scores`, `playoffs`, `playoff_teams`, `playoff_throws`

Restart PocketBase after migrations complete.

> **Why not use `pb-migrate.sh`?** That script hardcodes `--dir` to `backend/pb_data`, which differs from where `pb.sh` creates the runtime database (`pb_data` at repo root). Use the command above to target the correct directory.

---

### Step 6: Seed the Database

Start PocketBase, then run the seed scripts **in this order** from the `backend/` directory:

```bash
cd backend
```

**1. Sample users** (10 users across all roles — no auth required):

```bash
bash seed_data/seed-users.sh
```

**2. Demo role users** (4 users: admin, scorekeeper, pro, basic):

```bash
PB_ADMIN_EMAIL='<email>' PB_ADMIN_PASSWORD='<password>' PB_URL='http://127.0.0.1:8090' \
  npx tsx seed_data/seed-roles.ts
```

**3. Course, season, and tournament:**

```bash
PB_ADMIN_EMAIL='<email>' PB_ADMIN_PASSWORD='<password>' PB_URL='http://127.0.0.1:8090' \
  npx tsx seed_data/seed-course.ts
```

**4. Pro players and teams** (12 teams, 28 players):

```bash
PB_ADMIN_EMAIL='<email>' PB_ADMIN_PASSWORD='<password>' PB_URL='http://127.0.0.1:8090' \
  bash seed_data/seed-pros.sh
```

**5. Tournament settings:**

```bash
PB_ADMIN_EMAIL='<email>' PB_ADMIN_PASSWORD='<password>' PB_URL='http://127.0.0.1:8090' \
  npx tsx seed_data/seed-tournament-settings.ts
```

**Seed data summary:**

| Script | Creates |
|--------|---------|
| `seed-users.sh` | 10 users (2 admin, 2 scorekeeper, 2 pro, 4 basic) — password: `MADcap(123)` |
| `seed-roles.ts` | 4 demo users (one per role) — password: `Password123!` |
| `seed-course.ts` | 1 course (FLI Stadium Course), 1 season (2026), 1 tournament (FLI Championship) |
| `seed-pros.sh` | 12 teams, 24 rostered pros (real PDGA names), 4 reserve players |
| `seed-tournament-settings.ts` | Default settings for each tournament (format, tee times, etc.) |

---

### Step 7: Start the Frontend

From the repo root:

```bash
pnpm dev
```

The frontend runs on `0.0.0.0:5173` and proxies `/pb` requests to PocketBase at `localhost:8090` (configured in `frontend/vite.config.ts`).

---

## Quick Reference

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | `http://localhost:5173` | SvelteKit app |
| PocketBase API | `http://localhost:8090/api/` | REST API |
| PocketBase Admin | `http://localhost:8090/_/` | Admin dashboard |

---

## User Roles

| Role | Description |
|------|-------------|
| Anonymous | Public browsing (schedule, teams, players, media) |
| Basic User | Fantasy participation, saved preferences |
| Scorekeeper | Score entry and validation during events |
| Pro | Pro player access |
| Admin | Full CRUD, overrides, content scheduling |

---

## Dev Container

The `.devcontainer/` configuration provides a ready-to-use environment:

- **Base image:** Ubuntu 24.04 with Go, Node.js, pnpm
- **postCreateCommand:** Installs pnpm dependencies and Go modules
- **Automations:** PocketBase and frontend dev server start automatically via `postDevcontainerStart`
- **Ports:** 5173 (frontend) and 8090 (PocketBase) are exposed publicly

---

## Database & Migrations

- Schema migrations live in `backend/pb_migrations/`
- Runtime SQLite DB files (`pb_data/`) are gitignored
- Apply migrations with `pocketbase migrate up` before first use
- The PocketBase Go app (`backend/pbapp/main.go`) supports JSVM hooks and auto-migration in dev mode

---

## Contacts

**Client:** FLI Golf League
**CEO / Founder:** Andrew Panza
**IT Director / CTO:** Dustin Dinsmore
