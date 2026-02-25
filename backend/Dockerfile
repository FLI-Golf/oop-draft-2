# Build stage
FROM golang:1.24-alpine AS builder

WORKDIR /build

COPY pbapp/go.mod pbapp/go.sum ./
RUN go mod download

COPY pbapp/ .
RUN go build -o /pb/pocketbase .

# Runtime stage
FROM alpine:3.20

WORKDIR /pb

RUN apk add --no-cache ca-certificates
COPY --from=builder /pb/pocketbase /pb/pocketbase
RUN chmod +x /pb/pocketbase

COPY pb_migrations/ /pb/pb_migrations/

EXPOSE 8080

CMD ["/pb/pocketbase","serve","--http=0.0.0.0:8080","--dir","/pb/pb_data","--migrationsDir","/pb/pb_migrations","--hooksDir","/pb/pb_hooks"]
