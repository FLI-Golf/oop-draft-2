# FLI Golf League — Prototype Platform

Internal prototype for the **FLI Golf League** website, admin tools, and future mobile app.

This repository serves as a reference implementation for architecture, data modeling, admin workflows, and fantasy/game logic.

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
