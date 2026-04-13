#!/bin/sh
set -e

cd /var/www

# ── Ensure SQLite file exists ───────────────────────────────
if [ "${DB_CONNECTION}" = "sqlite" ]; then
  mkdir -p "$(dirname "${DB_DATABASE}")"
  if [ ! -f "${DB_DATABASE}" ]; then
    echo "Creating SQLite database at ${DB_DATABASE}..."
    touch "${DB_DATABASE}"
  fi
fi

# ── Ensure storage sub-dirs exist (volume may be empty) ─────
mkdir -p storage/framework/sessions \
         storage/framework/views \
         storage/framework/cache/data \
         storage/logs
chown -R appuser:appgroup storage bootstrap/cache database /data
chmod -R 775 storage bootstrap/cache database /data

# ── Ensure .env file exists (key:generate needs it) ─────────
if [ ! -f /var/www/.env ]; then
  echo "APP_KEY=" > /var/www/.env
fi

# ── Generate / restore APP_KEY (persist across restarts) ────
KEY_FILE="/data/sqlite/.app_key"
if [ -z "${APP_KEY}" ] || [ "${APP_KEY}" = "" ]; then
  if [ -f "${KEY_FILE}" ] && [ -s "${KEY_FILE}" ]; then
    echo "Loading persisted APP_KEY..."
    export APP_KEY=$(cat "${KEY_FILE}")
  else
    echo "No APP_KEY found, generating one..."
    php artisan key:generate --force
    export APP_KEY=$(grep '^APP_KEY=' /var/www/.env | cut -d= -f2-)
    echo "${APP_KEY}" > "${KEY_FILE}"
    echo "APP_KEY persisted to ${KEY_FILE}"
  fi
fi

# ── Sync APP_KEY to .env file (Laravel reads .env first) ────
if [ -n "${APP_KEY}" ]; then
  sed -i "s|^APP_KEY=.*|APP_KEY=${APP_KEY}|" /var/www/.env
  echo "APP_KEY synced to .env"
fi

# ── Clear caches ────────────────────────────────────────────
php artisan config:clear  || true
php artisan route:clear   || true
php artisan view:clear    || true

# ── Database migrate + seed ─────────────────────────────────
echo "Running migrations..."
php artisan migrate --force

echo "Seeding database..."
php artisan db:seed --force || true

# ── Start Laravel as non-root user (su-exec = Alpine gosu) ─
echo "Starting Laravel on 0.0.0.0:8000..."
exec su-exec appuser php artisan serve --host=0.0.0.0 --port=8000
