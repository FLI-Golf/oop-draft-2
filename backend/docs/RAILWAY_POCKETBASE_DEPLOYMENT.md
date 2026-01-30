# PocketBase Deployment Guide (Railway)

This document describes the **canonical, working process** for deploying a PocketBase backend to Railway using a Dockerfile, persistent volumes, and restoring data from a local development environment.

This guide exists to prevent repeating common pitfalls encountered during initial setup.

---

## Scope & Assumptions

- PocketBase is deployed via **Dockerfile**
- Source code lives in a GitHub repository
- PocketBase data is stored in `pb_data/`
- Migrations live in `pb_migrations/`
- Railway is used for hosting
- Local development uses the same PocketBase version as production

---

## Repository Structure (Expected)

```text
backend/
  Dockerfile
  pb_data/            # ignored in git
  pb_migrations/      # committed
  pb.sh               # local dev helper
  pocketbase          # optional local binary
