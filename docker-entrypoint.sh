#!/bin/sh
set -e

echo "🚀 Starting MediTrack..."

# -----------------------------
# Database connection settings
# -----------------------------
DB_HOST="postgres"
DB_PORT="5432"

if [ -n "$DATABASE_URL" ]; then
  DB_HOST=$(echo "$DATABASE_URL" | sed -E 's|.*@([^:/]+).*|\1|')
  DB_PORT=$(echo "$DATABASE_URL" | sed -E 's|.*:([0-9]+)/.*|\1|')
  [ -z "$DB_PORT" ] && DB_PORT=5432
fi

echo "⏳ Waiting for PostgreSQL at $DB_HOST:$DB_PORT..."

MAX_RETRIES=30
RETRY_DELAY=2
COUNT=0

until nc -z "$DB_HOST" "$DB_PORT"; do
  COUNT=$((COUNT + 1))
  if [ "$COUNT" -ge "$MAX_RETRIES" ]; then
    echo "❌ PostgreSQL not reachable after $MAX_RETRIES attempts"
    exit 1
  fi
  echo "⏳ PostgreSQL not ready (attempt $COUNT/$MAX_RETRIES)"
  sleep "$RETRY_DELAY"
done

echo "✅ PostgreSQL is ready"

# -----------------------------
# Run migrations (optional)
# -----------------------------
if [ "$RUN_MIGRATIONS" = "true" ]; then
  echo "📦 Running database migrations..."
  npx sequelize-cli db:migrate
  echo "✅ Migrations completed"
fi

echo "🚀 Launching application..."
exec "$@"
