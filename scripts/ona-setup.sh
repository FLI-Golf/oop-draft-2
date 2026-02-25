#!/usr/bin/env bash
set -euo pipefail

# Ona Quick-Start Script
# Run this when starting a new Ona/Gitpod session to get everything ready

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "=== FLI Golf - Ona Quick Start ==="
echo ""

# 1. Install dependencies
echo "[1/4] Installing dependencies..."
pnpm install
(cd backend && pnpm install --ignore-workspace)
echo "✅ Dependencies installed"
echo ""

# 2. Create superuser if credentials provided
if [[ -n "${POCKETBASE_ADMIN_EMAIL:-}" && -n "${POCKETBASE_ADMIN_PASSWORD:-}" ]]; then
  echo "[2/4] Creating PocketBase superuser..."
  (cd backend && go build -o bin/pbapp ./pbapp && ./bin/pbapp superuser upsert "$POCKETBASE_ADMIN_EMAIL" "$POCKETBASE_ADMIN_PASSWORD")
  echo "✅ Superuser created/updated"
else
  echo "[2/4] Skipping superuser (set POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD to enable)"
fi
echo ""

# 3. Run migrations
echo "[3/4] Running migrations..."
(cd backend && ./pb-migrate.sh)
echo "✅ Migrations applied"
echo ""

# 4. Summary
echo "[4/4] Setup complete!"
echo ""
echo "=== Next Steps ==="
echo ""
echo "Start PocketBase (in a terminal):"
echo "  cd backend && ./pb.sh"
echo ""
echo "Start Frontend (in another terminal):"
echo "  cd frontend && pnpm dev"
echo ""
echo "Seed database (after PocketBase is running):"
echo "  cd backend/seed_data"
echo "  ./seed-pros.sh              # 14 teams, 28 players (real PDGA pros)"
echo "  # Or for course/tournament data:"
echo "  # PB_ADMIN_EMAIL=\$POCKETBASE_ADMIN_EMAIL PB_ADMIN_PASSWORD=\$POCKETBASE_ADMIN_PASSWORD ../node_modules/.bin/tsx seed-course.ts"
echo ""
echo "=== Environment Variables ==="
echo "POCKETBASE_ADMIN_EMAIL=${POCKETBASE_ADMIN_EMAIL:-<not set>}"
echo "POCKETBASE_ADMIN_PASSWORD=${POCKETBASE_ADMIN_PASSWORD:+<set>}"
