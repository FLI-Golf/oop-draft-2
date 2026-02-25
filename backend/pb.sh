#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BIN_DIR="$ROOT_DIR/backend/bin"
PB="$BIN_DIR/pocketbase"
PBAPP_DIR="$ROOT_DIR/backend/pbapp"

# Load .env if present
if [ -f "$SCRIPT_DIR/.env" ]; then
  set -a
  source "$SCRIPT_DIR/.env"
  set +a
fi

PB_DATA_DIR="${PB_DATA_DIR:-$ROOT_DIR/backend/pb_data}"
PB_ORIGINS="${PB_ORIGINS:-}"

mkdir -p "$BIN_DIR" "$PB_DATA_DIR"

if [ ! -x "$PB" ]; then
  echo "Building PocketBase from backend/pbapp..."
  cd "$PBAPP_DIR"
  go build -o "$PB" .
  chmod +x "$PB"
  cd "$SCRIPT_DIR"
fi

echo "Starting PocketBase..."
echo "  Data dir: $PB_DATA_DIR"
echo "  Origins: $PB_ORIGINS"

ORIGINS_FLAG=""
if [ -n "$PB_ORIGINS" ]; then
  ORIGINS_FLAG="--origins=$PB_ORIGINS"
fi

exec "$PB" serve \
  --http=0.0.0.0:8090 \
  --dir "$PB_DATA_DIR" \
  --migrationsDir "$ROOT_DIR/backend/pb_migrations" \
  --hooksDir "$ROOT_DIR/backend/pb_hooks" \
  $ORIGINS_FLAG
