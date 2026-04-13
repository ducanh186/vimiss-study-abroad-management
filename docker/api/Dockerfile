# ==========================================================
# Vimiss API — Multi-stage Dockerfile (Alpine)
# Stage 1: Build frontend assets (Vite + React)
# Stage 2: PHP runtime with Laravel
# ==========================================================

# ── Stage 1: Build frontend assets ─────────────────────────
FROM node:20-alpine AS frontend
WORKDIR /build

# Copy package files first → tận dụng layer cache
COPY package.json package-lock.json* ./
RUN npm ci

# Copy chỉ những gì Vite cần để build
COPY vite.config.js ./
COPY resources/ ./resources/
COPY public/ ./public/

# Build ra public/build/
RUN npm run build

# ── Stage 2: PHP runtime (Alpine ~5MB base) ────────────────
FROM php:8.3-cli-alpine

# Gộp tất cả system deps vào 1 RUN → giảm layer
RUN apk add --no-cache \
        git unzip zip \
        libzip-dev libpng-dev oniguruma-dev libxml2-dev \
        sqlite sqlite-dev su-exec \
    && docker-php-ext-install pdo pdo_sqlite mbstring zip bcmath \
    && rm -rf /var/cache/apk/*

# Composer từ official image
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Tạo non-root user
RUN addgroup -g 1000 -S appgroup \
    && adduser -u 1000 -S appuser -G appgroup

WORKDIR /var/www

# ── Layer cache: composer install trước (ít thay đổi) ──────
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-interaction --prefer-dist --no-scripts

# ── Copy backend source (thay đổi thường xuyên hơn) ────────
COPY artisan ./artisan
COPY app ./app
COPY bootstrap ./bootstrap
COPY config ./config
COPY database ./database
COPY public ./public
COPY resources ./resources
COPY routes ./routes

# ── Copy frontend build artifacts từ stage 1 ────────────────
COPY --from=frontend /build/public/build ./public/build

# Tối ưu autoloader
RUN composer dump-autoload --no-dev --optimize

# ── Tạo writable dirs + set quyền cho appuser ──────────────
RUN mkdir -p storage/framework/sessions \
             storage/framework/views \
             storage/framework/cache/data \
             storage/logs \
             bootstrap/cache \
             database \
             /data/sqlite \
    && chown -R appuser:appgroup /var/www /data \
    && chmod -R 775 storage bootstrap/cache database /data

COPY docker/api/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Document port (không thực sự publish, chỉ để ghi chú)
EXPOSE 8000

# Exec format → nhận SIGTERM đúng cách
ENTRYPOINT ["/entrypoint.sh"]
