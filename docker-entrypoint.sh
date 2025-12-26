#!/bin/sh
set -e

echo "🚀 Starting MediTrack..."

# Wait for database
echo "⏳ Waiting for database..."
until npx prisma db execute --url "$DATABASE_URL" --stdin <<< "SELECT 1" > /dev/null 2>&1; do
  sleep 2
done
echo "✅ Database ready"

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate

# Run migrations
echo "📦 Running migrations..."
npx prisma migrate deploy || echo "⚠️  Migrations already applied"

# Build CSS if missing
[ ! -f "src/public/css/style.css" ] && \
  echo "🎨 Building CSS..." && \
  npx tailwindcss -i ./src/public/css/input.css -o ./src/public/css/style.css

echo "✅ Ready. Starting application..."
exec "$@"
