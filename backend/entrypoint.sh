#!/bin/sh
set -e

# Capture Railway's PORT before anything overrides it
RAILWAY_PORT="${PORT:-8080}"
PB_DIR="${PB_DIR:-/pb}"

echo "=== Entrypoint ==="
echo "PB_DIR: $PB_DIR"
echo "Migrations: $(ls $PB_DIR/pb_migrations/ 2>/dev/null | wc -l) files"

# Reset database if requested (useful when migrations table is out of sync)
if [ "$RESET_DB" = "true" ]; then
  echo "RESET_DB=true — wiping pb_data to re-run migrations from scratch..."
  rm -rf $PB_DIR/pb_data/*
fi

# Apply migrations
echo "Applying migrations..."
$PB_DIR/pocketbase migrate up --dir=$PB_DIR/pb_data --migrationsDir=$PB_DIR/pb_migrations 2>&1 || echo "migrate up via CLI skipped"

# Create superuser if env vars are set
if [ -n "$PB_ADMIN_EMAIL" ] && [ -n "$PB_ADMIN_PASSWORD" ]; then
  echo "Creating superuser..."
  $PB_DIR/pocketbase superuser upsert "$PB_ADMIN_EMAIL" "$PB_ADMIN_PASSWORD" --dir=$PB_DIR/pb_data 2>&1 || echo "superuser upsert skipped"
fi

# If frontend build exists, run full-stack mode
if [ -d "/app/frontend/build" ]; then
  echo "Full-stack mode: proxy :${RAILWAY_PORT} -> PB :8090 / SK :3000"

  # Start PocketBase in background on port 8090
  $PB_DIR/pocketbase serve --http=0.0.0.0:8090 --dir=$PB_DIR/pb_data --migrationsDir=$PB_DIR/pb_migrations --hooksDir=$PB_DIR/pb_hooks &
  PB_PID=$!

  echo "Waiting for PocketBase..."
  for i in $(seq 1 30); do
    if wget -q -O /dev/null http://127.0.0.1:8090/api/health 2>/dev/null; then
      echo "PocketBase ready"
      break
    fi
    sleep 1
  done

  # Start SvelteKit on port 3000 (PORT is scoped to this subprocess only)
  export POCKETBASE_URL=http://127.0.0.1:8090
  cd /app/frontend
  PORT=3000 HOST=0.0.0.0 node build &
  SK_PID=$!

  echo "Waiting for SvelteKit..."
  for j in $(seq 1 30); do
    if wget -q -O /dev/null http://127.0.0.1:3000 2>/dev/null; then
      echo "SvelteKit ready"
      break
    fi
    sleep 1
  done

  # Start reverse proxy on Railway's assigned port
  cd /app
  echo "Starting proxy on :${RAILWAY_PORT} -> PB:8090 / SK:3000"
  PORT=$RAILWAY_PORT exec node proxy.mjs
else
  echo "Backend-only mode on :8080"
  exec $PB_DIR/pocketbase serve --http=0.0.0.0:8080 --dir=$PB_DIR/pb_data --migrationsDir=$PB_DIR/pb_migrations --hooksDir=$PB_DIR/pb_hooks
fi
