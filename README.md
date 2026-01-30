# FLI Golf League — Prototype Platform

Internal prototype for the **FLI Golf League** website, admin tools, and future mobile app.

This repository serves as a **reference implementation** for architecture, data modeling, admin workflows, and fantasy/game logic. It is intentionally scoped for clarity, maintainability, and team handoff rather than full production polish.

---

## Project Purpose

The FLI Golf League platform supports:

- Public league information (schedule, teams, players, media)
- Admin and scorekeeper tooling
- A fantasy experience tied to real tournament results
- A future companion mobile app (iOS / Android)

This repo is designed so a future team can:
- understand the data model quickly
- extend functionality safely
- migrate logic into PocketBase Go hooks where appropriate

---

## Tech Stack

### Frontend
- **SvelteKit**
- **TypeScript**
- **Tailwind CSS**
- **shadcn-svelte** (UI primitives only)

### Backend
- **PocketBase**
  - SQLite (runtime)
  - Migrations committed
  - Runtime DB ignored
- Planned: **PocketBase Go hooks** for validation and derived data

### State & Auth
- PocketBase authentication
- Role-based access (rules + UI)
- Prototype-only local state via `localStorage` (e.g. work-order checklist)

---

## User Roles

| Role | Description |
|----|------------|
| Anonymous | Public browsing (schedule, teams, players, media, merch preview) |
| Authenticated | Fantasy participation, saved preferences, history |
| Scorekeeper | Score entry and validation during events |
| Admin | Full CRUD, overrides, content scheduling, audits |

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
      components/ui/  → shadcn primitives (button, card, table)

backend/
  pb_migrations/      → PocketBase schema migrations
  bin/                → PocketBase binary (ignored)
  pb_data/            → Runtime DB (ignored)

shared/
  dist/domain/        → Shared domain models (Tournament, Course, etc.)

  Key Features Implemented

✅ Tournament Admin

Create and manage tournaments

Required season field enforced at domain level

Course relationships with expand support

✅ Interactive Work Order

CEO-provided specification converted into a live checklist

Progress tracked via localStorage

Designed for future persistence in PocketBase

✅ Domain Modeling

Shared domain objects (Tournament, Course, etc.)

Clear separation between records and business logic

✅ Clean Git Hygiene

Runtime databases ignored

Migrations committed

Single root .gitignore

Getting Started (Local Development)
1. Install dependencies
pnpm install

2. Start PocketBase
cd backend
./pb.sh serve


PocketBase Admin UI:

http://127.0.0.1:8090/_/

3. Run the frontend
cd frontend
pnpm dev


Frontend app:

http://localhost:5173

Database & Migrations

All schema changes live in backend/pb_migrations/

Runtime SQLite DB files are intentionally not tracked

Developers should apply migrations locally via PocketBase

Architecture Notes
Records vs Domain Objects

PocketBase records are used directly for listing and basic CRUD

Domain objects encapsulate validation, rules, and calculations

Mapping layers may be introduced as complexity increases

Why PocketBase

Extremely fast iteration

Built-in auth and access rules

Easy migration of logic into Go hooks

Ideal for small teams and prototype-first workflows

Future Direction (Intentional)

This project is intentionally not overbuilt.

Planned or possible next steps:

Persist checklist state in PocketBase

Add scorekeeper-only routes and permissions

Introduce Go hooks (season validation, score locking)

Build mobile client using same API and domain models

Project Status

🟡 Active Prototype / Reference Implementation

Development may pause and resume over time.
Commits are structured to remain understandable and useful even if work is intermittent.

Contacts

Client: FLI Golf League
CEO / Founder: Andrew Panza
IT Director / CTO: Dustin Dinsmore

License & Usage

Internal prototype for planning and development reference.
Not intended for public redistribution.


---

If you want, next we can:
- add `docs/ARCHITECTURE.md`
- add `docs/POCKETBASE_RULES.md`
- tag this commit as a **milestone**
- or cleanly pause the repo in a “handoff-ready” state

This README is now **production-grade documentation for a prototype**.
