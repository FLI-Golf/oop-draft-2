#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PB="$ROOT_DIR/backend/bin/pocketbase"
PB_DATA_DIR="$ROOT_DIR/backend/pb_data"
MIGRATIONS_DIR="$ROOT_DIR/backend/pb_migrations"

if [ ! -x "$PB" ]; then
  echo "PocketBase binary not found at: $PB"
  echo "Run: bash backend/pb.sh (it will download pocketbase)"
  exit 1
fi

mkdir -p "$PB_DATA_DIR" "$MIGRATIONS_DIR"

echo "Applying migrations..."
echo "  Migrations dir: $MIGRATIONS_DIR"
echo "  Data dir:       $PB_DATA_DIR"
exec "$PB" migrate up --dir "$PB_DATA_DIR" --migrationsDir "$MIGRATIONS_DIR"
