#!/bin/sh
set -e

# Apply migrations
/pb/pocketbase migrate up --dir=/pb/pb_data --migrationsDir=/pb/pb_migrations 2>/dev/null || true

# Create superuser if env vars are set and no superuser exists yet
if [ -n "$PB_ADMIN_EMAIL" ] && [ -n "$PB_ADMIN_PASSWORD" ]; then
  /pb/pocketbase superuser upsert "$PB_ADMIN_EMAIL" "$PB_ADMIN_PASSWORD" --dir=/pb/pb_data 2>/dev/null || true
fi

exec /pb/pocketbase serve --http=0.0.0.0:8080 --dir=/pb/pb_data --migrationsDir=/pb/pb_migrations --hooksDir=/pb/pb_hooks
