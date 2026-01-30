

## Development Workflow Strategy (Local-First → Final Sync)

This project intentionally follows a **local-first development workflow** for PocketBase and the frontend.

### Guiding Principle

> **All active development happens locally.  
> Railway is treated as a deployment target, not a development environment.**

Railway is only updated at intentional milestones (previews, handoff, or release).

---

## Day-to-Day Development

During normal development:

- PocketBase runs **locally**
  - Local `pb_data/` is the source of truth
  - Schema changes are captured via:
    - committed `pb_migrations/`
    - or controlled admin changes during prototyping
- Frontend connects to **local PocketBase**
- Railway is **not** updated continuously
- No attempt is made to keep Railway “in sync” during active iteration

This avoids:
- accidental data drift
- partial schema deployments
- broken restores
- confusion about which environment is authoritative

---

## When Railway Is Updated

Railway is only updated at **intentional sync points**, such as:

- End of a development phase
- Before a demo or stakeholder review
- Before onboarding collaborators
- Before production hardening

At that point, the **full Local → Railway sync process** is executed.

---

## Canonical Sync Process (Repeatable)

When ready to deploy the current local state to Railway:

1. **Finish local development**
   - Ensure local PocketBase data and schema are correct
   - Verify app behavior against local backend

2. **Create a local PocketBase backup**
   - Local Admin UI → Settings → Backups
   - Name clearly (e.g. `local-dev-final-YYYY-MM-DD.zip`)

3. **Ensure Railway service is ready**
   - Correct Dockerfile in use
   - No custom start command
   - Volume mounted at `/pb/pb_data`
   - Public networking configured

4. **Restore backup into Railway**
   - Railway PocketBase Admin → Settings → Backups
   - Upload + Restore the local backup ZIP
   - Restart service

5. **Verify**
   - Collections present
   - Records present
   - Admin users correct
   - Data persists after restart

This process is **intentionally repeatable** and should be followed exactly each time.

---

## Important Notes

- Restoring a backup **replaces the entire database**
  - Admin users, collections, and records are overwritten
- Any admins created directly on Railway may be removed after restore
- Railway should never be treated as a “scratch” environment
- If something looks wrong after restore, **do not patch it live** — fix locally and re-sync

---

## Why This Workflow Exists

This approach prioritizes:

- clarity of authority (local is truth)
- reproducibility
- fewer Railway surprises
- easier handoff and onboarding
- confidence during future redeploys

If something breaks in Railway, the solution is always:
> **Fix locally → backup → restore**

Not ad-hoc edits.

---

## Status

This workflow has been tested and confirmed working.

Use this section as the reference for **how development and deployment are intentionally separated** in this project.

---

## Milestone Deployments (GitHub Actions)

We intentionally do **local-first development** and only deploy to Railway at milestones.

### Strategy

- Normal work happens locally (frontend + PocketBase).
- At a milestone:
  1. Merge code changes to `main` (or a release branch)
  2. Create a local PocketBase backup
  3. Restore the backup into Railway PocketBase Admin
  4. Trigger a **GitHub Action** to deploy the backend service to Railway

### Why

- Prevents accidental redeploys
- Keeps Railway stable and “demo-ready”
- Ensures DB restore and code deploy happen intentionally together

### Options for triggering milestone deploys

**Option A: Manual trigger (recommended)**
- Use `workflow_dispatch` so deployment only occurs when manually started.

**Option B: Tag-based trigger**
- Push a tag like `milestone-2026-02-15` to trigger a deploy.
- Helpful for “release snapshots” and rollback points.


