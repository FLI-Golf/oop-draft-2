#!/usr/bin/env bash
set -euo pipefail

PB_VERSION="0.24.2"
OS="linux"
ARCH="amd64"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BIN_DIR="$ROOT_DIR/backend/bin"
PB_DATA_DIR="$ROOT_DIR/backend/pb_data"
PB="$BIN_DIR/pocketbase"

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
echo "  Admin UI: http://127.0.0.1:8090/_/"
exec "$PB" serve --http=0.0.0.0:8090 --dir "$PB_DATA_DIR"
