# ── Stage 1: Build FE ────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files first (layer cache)
COPY fe-neu/package.json fe-neu/package-lock.json* ./fe-neu/

WORKDIR /app/fe-neu
RUN npm ci

# Copy FE source and build
COPY fe-neu/ /app/fe-neu/
RUN npm run build

# ── Stage 2: Serve with Nginx ───────────────────────────────
FROM nginx:alpine
COPY docker/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/fe-neu/dist /usr/share/nginx/html
EXPOSE 80
