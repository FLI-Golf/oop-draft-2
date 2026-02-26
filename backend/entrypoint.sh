#!/bin/sh
set -e

PB_DIR="${PB_DIR:-/pb}"

echo "=== Entrypoint ==="
echo "PB_DIR: $PB_DIR"
echo "Migrations: $(ls $PB_DIR/pb_migrations/ 2>/dev/null | wc -l) files"

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
  echo "Full-stack mode: PocketBase on :8090, SvelteKit on :8080"

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

  echo "Frontend started"
  wait $PB_PID $SK_PID
else
  echo "Backend-only mode on :8080"
  exec $PB_DIR/pocketbase serve --http=0.0.0.0:8080 --dir=$PB_DIR/pb_data --migrationsDir=$PB_DIR/pb_migrations --hooksDir=$PB_DIR/pb_hooks
fi
