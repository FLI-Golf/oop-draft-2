# Backend Deployment (Railway)

## Prerequisites

- [Railway CLI](https://docs.railway.app/guides/cli) installed
- Railway account

## Setup

### 1. Create a Railway project

```bash
cd backend
railway login
railway init
```

### 2. Add a persistent volume

PocketBase uses SQLite — the database must survive deploys.

```bash
railway volume add --mount /pb/pb_data
```

Or via the Railway dashboard: **Service → Settings → Volumes → Add Volume**, mount path: `/pb/pb_data`

### 3. Set environment variables (optional)

If you want the frontend to connect, set CORS origins:

```bash
railway variables set PB_ORIGINS="https://your-frontend-domain.com"
```

### 4. Deploy

```bash
railway up
```

Railway detects the `Dockerfile` and builds automatically.

### 5. Create superuser

After first deploy, open the Railway service logs to find the install URL, or use the Railway shell:

```bash
railway run /pb/pocketbase superuser upsert 'your@email.com' 'your-password' --dir /pb/pb_data
```

### 6. Run migrations

Migrations run automatically on startup via the JSVM plugin in `main.go` (automigrate is enabled when running from a temp directory, i.e., `go run`). For the compiled binary, migrations are applied from `/pb/pb_migrations/` on first access.

To manually apply:

```bash
railway run /pb/pocketbase migrate up --dir /pb/pb_data --migrationsDir /pb/pb_migrations
```

## What gets deployed

| Component | Source | Container path |
|-----------|--------|---------------|
| Go binary | `pbapp/main.go` (compiled) | `/pb/pocketbase` |
| Migrations | `pb_migrations/` | `/pb/pb_migrations/` |
| Database | Railway volume | `/pb/pb_data/` |

## Alternative platforms

### Fly.io

```bash
cd backend
fly launch --no-deploy
fly volumes create pb_data --size 1
```

Add to `fly.toml`:
```toml
[mounts]
  source = "pb_data"
  destination = "/pb/pb_data"
```

Then `fly deploy`.

### Render

Use a Docker web service with a persistent disk mounted at `/pb/pb_data`.

## Health check

```
GET /api/health
```

Returns `200` when the service is running.

## Port

The container listens on port `8080`. Configure your platform to route traffic to this port.
