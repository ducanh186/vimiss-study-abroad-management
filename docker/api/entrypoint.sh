#!/usr/bin/env bash
set -e

cd /var/www

# ── Ensure SQLite file exists ───────────────────────────────
if [ "${DB_CONNECTION}" = "sqlite" ]; then
  mkdir -p "$(dirname "${DB_DATABASE}")"
  if [ ! -f "${DB_DATABASE}" ]; then
    echo "📦 Creating SQLite database at ${DB_DATABASE}..."
    touch "${DB_DATABASE}"
  fi
fi

# ── Ensure storage sub-dirs exist (volume may be empty) ─────
mkdir -p storage/framework/sessions \
         storage/framework/views \
         storage/framework/cache/data \
         storage/logs
chmod -R 777 storage bootstrap/cache database

# ── Ensure .env file exists (key:generate needs it) ─────────
if [ ! -f /var/www/.env ]; then
  echo "APP_KEY=" > /var/www/.env
fi

# ── Generate APP_KEY if missing ─────────────────────────────
if [ -z "${APP_KEY}" ] || [ "${APP_KEY}" = "" ]; then
  echo "🔑 No APP_KEY set, generating one..."
  php artisan key:generate --force
  # Export the generated key into the running environment
  export APP_KEY=$(grep '^APP_KEY=' /var/www/.env | cut -d= -f2-)
fi

# ── Clear caches (safe on fresh start) ──────────────────────
php artisan config:clear  || true
php artisan route:clear   || true
php artisan view:clear    || true

# ── Database migrate + seed ─────────────────────────────────
echo "🗃️  Running migrations..."
php artisan migrate --force

echo "🌱 Seeding database..."
php artisan db:seed --force || true

# ── Start the Laravel dev server ────────────────────────────
echo "🚀 Starting Laravel on 0.0.0.0:8000..."
exec php artisan serve --host=0.0.0.0 --port=8000
