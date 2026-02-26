# Stage 1: Build PocketBase Go binary
FROM golang:1.24-alpine AS go-builder

WORKDIR /build
COPY backend/pbapp/go.mod backend/pbapp/go.sum ./
RUN go mod download
COPY backend/pbapp/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -o /build/pocketbase .

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
COPY --from=go-builder /build/pocketbase /pb/pocketbase
COPY backend/pb_migrations/ /pb/pb_migrations/
RUN mkdir -p /pb/pb_data

# Frontend build + runtime deps
COPY --from=frontend-builder /app/frontend/build /app/frontend/build
COPY --from=frontend-builder /app/frontend/package.json /app/frontend/package.json
COPY --from=frontend-builder /app/shared /app/shared

# Install runtime deps with npm (avoids pnpm symlink issues)
WORKDIR /app/frontend
RUN sed -i 's/"@oop-draft-2\/shared": "workspace:\*"/"@oop-draft-2\/shared": "file:..\/shared"/' package.json \
    && npm install --omit=dev --ignore-scripts 2>&1 | tail -5
WORKDIR /

# Reverse proxy and entrypoint
COPY proxy.mjs /app/proxy.mjs
COPY backend/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

ENV PB_DIR=/pb
EXPOSE 8080

ENTRYPOINT ["/app/entrypoint.sh"]
