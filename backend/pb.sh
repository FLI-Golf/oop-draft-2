#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PBAPP_DIR="$SCRIPT_DIR/pbapp"
BIN_DIR="$SCRIPT_DIR/bin"
PBAPP_BIN="$BIN_DIR/pbapp"

# Load .env if present
if [ -f "$SCRIPT_DIR/.env" ]; then
  set -a
  source "$SCRIPT_DIR/.env"
  set +a
fi

PB_DATA_DIR="${PB_DATA_DIR:-$SCRIPT_DIR/pb_data}"
PB_ORIGINS="${PB_ORIGINS:-}"

mkdir -p "$BIN_DIR" "$PB_DATA_DIR"

# Build the Go app (Go's build cache skips unnecessary rebuilds)
echo "Building PocketBase app from backend/pbapp..."
(cd "$PBAPP_DIR" && go build -o "$PBAPP_BIN" .)
echo "Build complete."

echo "Starting PocketBase..."
echo "  Data dir: $PB_DATA_DIR"
echo "  Origins:  $PB_ORIGINS"

ORIGINS_FLAG=""
if [ -n "$PB_ORIGINS" ]; then
  ORIGINS_FLAG="--origins=$PB_ORIGINS"
fi

exec "$PBAPP_BIN" serve \
  --http=0.0.0.0:8090 \
  --dir "$PB_DATA_DIR" \
  --migrationsDir "$SCRIPT_DIR/pb_migrations" \
  --hooksDir "$SCRIPT_DIR/pb_hooks" \
  $ORIGINS_FLAG
