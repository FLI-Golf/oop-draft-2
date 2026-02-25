# Build stage
FROM golang:1.22-alpine AS builder

WORKDIR /build

# Copy Go module files and download deps
COPY pbapp/go.mod pbapp/go.sum ./
RUN go mod download

# Copy source and build
COPY pbapp/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -o /build/pocketbase .

# Runtime stage
FROM alpine:3.20

WORKDIR /pb

RUN apk add --no-cache ca-certificates

COPY --from=builder /build/pocketbase /pb/pocketbase
COPY pb_migrations/ /pb/pb_migrations/

# pb_data is mounted as a volume in production
RUN mkdir -p /pb/pb_data

EXPOSE 8080

CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8080", "--dir=/pb/pb_data", "--migrationsDir=/pb/pb_migrations", "--hooksDir=/pb/pb_hooks"]
