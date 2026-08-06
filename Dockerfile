# Stage 1: Download stock PocketBase binary
FROM alpine:3.20 AS pb-downloader
ARG PB_VERSION=0.24.2
RUN apk add --no-cache curl unzip \
    && curl -fsSL -o /tmp/pb.zip \
       "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip" \
    && unzip /tmp/pb.zip -d /tmp/pb \
    && chmod +x /tmp/pb/pocketbase

# Stage 2: Build SvelteKit frontend
FROM node:18-alpine AS frontend-builder

RUN npm install -g pnpm

WORKDIR /app

# Copy workspace config
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy shared package
COPY shared/ ./shared/

# Copy frontend
COPY frontend/ ./frontend/

# Install deps
RUN pnpm install --frozen-lockfile || pnpm install

# Build frontend with adapter-node
ENV NODE_ENV=production
ENV RAILWAY_ENVIRONMENT=true
RUN pnpm -C frontend build

# Stage 3: Runtime
FROM node:18-alpine

RUN apk add --no-cache ca-certificates

# PocketBase
COPY --from=pb-downloader /tmp/pb/pocketbase /pb/pocketbase
COPY backend/pb_migrations/ /pb/pb_migrations/
RUN mkdir -p /pb/pb_data /pb/pb_hooks

# Frontend build — all deps are bundled by adapter-node (dependencies is empty),
# so no node_modules needed at runtime
COPY --from=frontend-builder /app/frontend/build /app/frontend/build
COPY --from=frontend-builder /app/frontend/package.json /app/frontend/package.json

# Reverse proxy and entrypoint
COPY proxy.mjs /app/proxy.mjs
COPY backend/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

ENV PB_DIR=/pb
EXPOSE 8080

ENTRYPOINT ["/app/entrypoint.sh"]
