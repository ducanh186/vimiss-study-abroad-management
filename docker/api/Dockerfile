FROM php:8.3-cli

# System deps for Laravel + SQLite + zip
RUN apt-get update && apt-get install -y \
    git unzip zip libzip-dev libpng-dev libonig-dev libxml2-dev sqlite3 \
  && docker-php-ext-install pdo pdo_sqlite mbstring zip bcmath \
  && rm -rf /var/lib/apt/lists/*

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

# Copy composer files first (layer cache)
COPY composer.json composer.lock ./
RUN composer install --no-interaction --prefer-dist --no-scripts

# Copy full Laravel source
COPY . /var/www

# Re-run composer scripts (post-autoload-dump etc.)
RUN composer run-script post-autoload-dump || true

# Ensure writable directories exist
RUN mkdir -p /var/www/storage/framework/sessions \
             /var/www/storage/framework/views \
             /var/www/storage/framework/cache/data \
             /var/www/storage/logs \
             /var/www/bootstrap/cache \
             /var/www/database \
  && chmod -R 777 /var/www/storage /var/www/bootstrap/cache /var/www/database

COPY docker/api/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8000
ENTRYPOINT ["/entrypoint.sh"]
