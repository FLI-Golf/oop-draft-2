#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PBAPP_DIR="$SCRIPT_DIR/pbapp"
BIN_DIR="$SCRIPT_DIR/bin"
PBAPP_BIN="$BIN_DIR/pbapp"
PB_DATA_DIR="$SCRIPT_DIR/pb_data"
MIGRATIONS_DIR="$SCRIPT_DIR/pb_migrations"

# Build the Go app (Go's build cache skips unnecessary rebuilds)
echo "Building PocketBase app from backend/pbapp..."
(cd "$PBAPP_DIR" && go build -o "$PBAPP_BIN" .)
echo "Build complete."

mkdir -p "$PB_DATA_DIR" "$MIGRATIONS_DIR"

echo "Applying migrations..."
echo "  Migrations dir: $MIGRATIONS_DIR"
echo "  Data dir:       $PB_DATA_DIR"
exec "$PBAPP_BIN" migrate up --dir "$PB_DATA_DIR" --migrationsDir "$MIGRATIONS_DIR"
