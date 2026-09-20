FROM php:8.4-cli-alpine

RUN apk add --no-cache \
        git \
        icu-dev \
        libpq-dev \
        libzip-dev \
        oniguruma-dev \
        unzip \
    && docker-php-ext-install -j"$(nproc)" \
        intl \
        mbstring \
        pcntl \
        pdo_pgsql \
        zip

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

EXPOSE 8000

CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
