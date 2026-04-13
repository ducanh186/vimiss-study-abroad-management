# ==========================================================
# Vimiss Web — Multi-stage: Build assets → Nginx Alpine
# Nginx phục vụ static files + reverse proxy tới Laravel API
# ==========================================================

# ── Stage 1: Build frontend assets (Vite + React) ──────────
FROM node:20-alpine AS builder
WORKDIR /build

# Copy package files first → tận dụng layer cache
COPY package.json package-lock.json* ./
RUN npm ci

# Copy chỉ những file Vite cần
COPY vite.config.js ./
COPY resources/ ./resources/
COPY public/ ./public/

# Build tạo ra public/build/ chứa JS/CSS đã minify
RUN npm run build

# ── Stage 2: Nginx Alpine (~5MB) phục vụ static + proxy ────
FROM nginx:alpine

# Xóa config + html mặc định của nginx, dùng custom
RUN rm -rf /etc/nginx/conf.d/default.conf /usr/share/nginx/html/*

# Copy nginx config — chỉ copy đúng file cần thiết
COPY docker/web/nginx.conf /etc/nginx/conf.d/default.conf

# Copy static assets từ builder stage (không mang theo node_modules)
COPY --from=builder /build/public/build /usr/share/nginx/html/build
COPY --from=builder /build/public/images /usr/share/nginx/html/images
COPY --from=builder /build/public/landing-assets /usr/share/nginx/html/landing-assets

# Non-root: set quyền cho nginx user (có sẵn trong nginx:alpine)
RUN chown -R nginx:nginx /usr/share/nginx/html \
    && chown -R nginx:nginx /var/cache/nginx \
    && chown -R nginx:nginx /var/log/nginx \
    && touch /var/run/nginx.pid \
    && chown -R nginx:nginx /var/run/nginx.pid

# Document port — chỉ là ghi chú, port thực tế dùng -p khi run
EXPOSE 80

# Exec format → process nhận SIGTERM đúng cách, daemon off bắt buộc
CMD ["nginx", "-g", "daemon off;"]
