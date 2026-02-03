#!/usr/bin/env bash
set -euo pipefail

PB_VERSION="0.24.2"
OS="linux"
ARCH="amd64"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BIN_DIR="$ROOT_DIR/backend/bin"
PB="$BIN_DIR/pocketbase"

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
  echo "Downloading PocketBase v${PB_VERSION}..."
  tmp="$(mktemp -d)"
  curl -fsSL -o "$tmp/pb.zip" \
    "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_${OS}_${ARCH}.zip"
  unzip -o "$tmp/pb.zip" -d "$tmp" >/dev/null
  mv "$tmp/pocketbase" "$PB"
  chmod +x "$PB"
  rm -rf "$tmp"
fi

echo "Starting PocketBase..."
echo "  Data dir: $PB_DATA_DIR"
echo "  Origins: $PB_ORIGINS"

ORIGINS_FLAG=""
if [ -n "$PB_ORIGINS" ]; then
  ORIGINS_FLAG="--origins=$PB_ORIGINS"
fi

exec "$PB" serve --http=0.0.0.0:8090 --dir "$PB_DATA_DIR" $ORIGINS_FLAG
