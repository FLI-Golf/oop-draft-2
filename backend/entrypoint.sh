#!/bin/sh
set -e

PB_DIR="${PB_DIR:-/pb}"

# Apply migrations
$PB_DIR/pocketbase migrate up --dir=$PB_DIR/pb_data --migrationsDir=$PB_DIR/pb_migrations 2>/dev/null || true

# Create superuser if env vars are set
if [ -n "$PB_ADMIN_EMAIL" ] && [ -n "$PB_ADMIN_PASSWORD" ]; then
  $PB_DIR/pocketbase superuser upsert "$PB_ADMIN_EMAIL" "$PB_ADMIN_PASSWORD" --dir=$PB_DIR/pb_data 2>/dev/null || true
fi

# If frontend build exists, run full-stack mode
if [ -d "/app/frontend/build" ]; then
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

  # Start SvelteKit on port 8080
  export POCKETBASE_URL=http://127.0.0.1:8090
  export PORT=8080
  export HOST=0.0.0.0
  cd /app/frontend
  node build &
  SK_PID=$!

  echo "Frontend on :8080, PocketBase on :8090"
  wait $PB_PID $SK_PID
else
  # Backend-only mode
  exec $PB_DIR/pocketbase serve --http=0.0.0.0:8080 --dir=$PB_DIR/pb_data --migrationsDir=$PB_DIR/pb_migrations --hooksDir=$PB_DIR/pb_hooks
fi
