

# FLI Golf League — Prototype Platform

Internal prototype for the **FLI Golf League** website, admin tools, and future mobile app.

This repository serves as a **reference implementation** for architecture, data modeling, admin workflows, and fantasy/game logic. It is intentionally scoped for clarity, maintainability, and team handoff rather than full production polish.

---

## Project Purpose

The FLI Golf League platform supports:

* Public league information (schedule, teams, players, media)
* Admin and scorekeeper tooling
* A fantasy experience tied to real tournament results
* A future companion mobile app (iOS / Android)

This repo is designed so a future team can:

* Understand the data model quickly
* Extend functionality safely
* Migrate logic into PocketBase Go hooks where appropriate

---

## Tech Stack

### Frontend

* **SvelteKit**
* **TypeScript**
* **Tailwind CSS**
* **shadcn-svelte** (UI primitives only)

### Backend

* **PocketBase**

  * SQLite (runtime)
  * Schema migrations committed
  * Runtime database ignored
* Planned: **PocketBase Go hooks** for validation and derived data

### State & Auth

* PocketBase authentication
* Role-based access (rules + UI)
* Prototype-only local state via `localStorage` (e.g. internal work-order checklist)

---

## User Roles

| Role          | Description                                                      |
| ------------- | ---------------------------------------------------------------- |
| Anonymous     | Public browsing (schedule, teams, players, media, merch preview) |
| Authenticated | Fantasy participation, saved preferences, history                |
| Scorekeeper   | Score entry and validation during events                         |
| Admin         | Full CRUD, overrides, content scheduling, audits                 |

---

## Repository Structure

```text
frontend/
  src/
    routes/
      /               → Landing page
      /work-order     → Interactive internal spec & checklist
      /tournaments    → Admin tournament management
    lib/
      components/
        CreateTournaments.svelte
      components/ui/  → shadcn UI primitives

backend/
  pb.sh               → PocketBase startup script (source of truth)
  pocket              → PocketBase binary
  pb_migrations/      → Schema migrations (tracked)
  pb_data/            → Runtime database (ignored)
  seed_data/          → Database seed scripts
  docs/               → PocketBase reference docs & notes

shared/
  dist/domain/        → Shared domain models (Tournament, Course, etc.)
```

---

## Key Features Implemented

### ✅ Tournament Admin

* Create and manage tournaments
* Required `season` field enforced at domain level
* Course relationships with expand support

### ✅ Interactive Work Order

* CEO-provided specification converted into a live checklist
* Progress tracked via `localStorage`
* Designed for future persistence in PocketBase

### ✅ Domain Modeling

* Shared domain objects (Tournament, Course, etc.)
* Clear separation between records and business logic

### ✅ Clean Git Hygiene

* Runtime databases ignored
* Migrations committed
* Single root `.gitignore`

---

## Getting Started

### Environment Files

Two environment templates are provided:

| File | Use Case |
|------|----------|
| `.env.ona` | Gitpod / Ona sessions |
| `.env.codespace` | GitHub Codespaces |

Copy the appropriate file to `.env` or source it directly:

```bash
# Gitpod/Ona
source .env.ona

# GitHub Codespaces
source .env.codespace
```

---

### Quick Start (Ona/Gitpod Sessions)

For returning to the project after a break:

```bash
source .env.ona
./scripts/ona-setup.sh
```

This installs dependencies, creates the superuser, and runs migrations.

Then start services:

```bash
# Terminal 1: PocketBase (from repo root)
pnpm pb:dev

# Terminal 2: Frontend
cd frontend && pnpm dev

# Terminal 3 (optional): Seed database
cd backend/seed_data
./seed-pros.sh    # Creates 14 teams, 28 players (real PDGA pros)
```

---

### Quick Start (GitHub Codespaces)

```bash
source .env.codespace
./scripts/ona-setup.sh
```

Then start services (same as above). Access via forwarded ports in the Codespaces UI.

---

### Manual Setup

#### 1. Install dependencies

```bash
pnpm install
cd backend && pnpm install --ignore-workspace
```

> Note: Backend is not in pnpm workspace, requires separate install.

#### 2. Create superuser

```bash
cd backend && ./bin/pocketbase superuser upsert EMAIL PASSWORD
```

#### 3. Start PocketBase

```bash
# From repo root (recommended):
pnpm pb:dev

# Or from the backend/ directory:
cd backend && ./pb.sh
```

**PocketBase Admin UI:**

```
http://127.0.0.1:8090/_/
```

> `pb.sh` handles the correct binary, data directory, and migration setup.
> This is the **only supported way** to run PocketBase for this repo.

---

#### 4. Run the frontend

```bash
cd frontend
pnpm dev
```

**Frontend app:**

```
http://localhost:5173
```

---

#### 5. Seed database (optional)

With PocketBase running:

```bash
cd backend/seed_data
./seed-pros.sh
```

This creates:
- 12 Pro Teams with real PDGA pros (24 rostered players: 12 male, 12 female)
- 4 Reserve Players (2 male, 2 female) - not on teams, fill in when needed
- Total: 12 teams, 28 players with ratings and world rankings

---

## Database & Migrations

* All schema changes live in `backend/pb_migrations/`
* Runtime SQLite DB files are intentionally **not tracked**
* Developers should apply migrations locally via PocketBase startup

---

## Architecture Notes

### Records vs Domain Objects

* PocketBase records are used directly for listing and basic CRUD
* Domain objects encapsulate validation, rules, and calculations
* Mapping layers may be introduced as complexity increases

### Why PocketBase

* Extremely fast iteration
* Built-in auth and access rules
* Easy migration of logic into Go hooks
* Ideal for small teams and prototype-first workflows

---

## Future Direction (Intentional)

This project is intentionally **not overbuilt**.

Planned or possible next steps:

* Persist checklist state in PocketBase
* Add scorekeeper-only routes and permissions
* Introduce Go hooks (season validation, score locking)
* Build mobile client using the same API and domain models

---

## Project Status

🟡 **Active Prototype / Reference Implementation**

Development may pause and resume over time.
Commits are structured to remain understandable and useful even if work is intermittent.

---

## Contacts

**Client:** FLI Golf League
**CEO / Founder:** Andrew Panza
**IT Director / CTO:** Dustin Dinsmore

---

## License & Usage

Internal prototype for planning and development reference.
Not intended for public redistribution.

---

If you want, next we can:

* Add `docs/ARCHITECTURE.md`
* Add `docs/POCKETBASE_RULES.md`
* Tag this commit as a **milestone**
* Or freeze the repo in a **handoff-ready state**

This README is now **production-grade documentation for a prototype**.
