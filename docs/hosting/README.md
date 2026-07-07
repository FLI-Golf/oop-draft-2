# Hosting

The app runs as a single Docker container on Railway. Three processes share the container:

| Process | Internal port | Role |
|---------|--------------|------|
| PocketBase | 8090 | API + admin UI + SQLite database |
| SvelteKit (adapter-node) | 3000 | SSR frontend |
| Reverse proxy (`proxy.mjs`) | Railway's `PORT` | Routes traffic between PB and SK |

Railway exposes one port. The proxy listens on it and forwards:

- `/api/*`, `/_/*`, `/_` → PocketBase (8090)
- Everything else → SvelteKit (3000)

```
Browser ──► Railway edge (HTTP/2) ──► proxy.mjs (HTTP/1.1)
                                        ├── /api/*, /_/* → PocketBase :8090
                                        └── /*           → SvelteKit  :3000
```

## Key files

| File | Purpose |
|------|---------|
| `Dockerfile` | Multi-stage build: Go binary, SvelteKit build, runtime |
| `backend/entrypoint.sh` | Starts PB, SK, and proxy in sequence |
| `proxy.mjs` | HTTP reverse proxy with HTTP/2 header sanitization |
| `railway.toml` | Build and deploy config (healthcheck, restart policy) |
| `frontend/svelte.config.js` | Uses `adapter-node` when `RAILWAY_ENVIRONMENT` is set |
| `frontend/vite.config.ts` | `ssr.noExternal` bundles pocketbase and shared into SSR output |

## Docker build stages

**Stage 1 — Go builder:** Compiles `backend/pbapp/main.go` into a static PocketBase binary.

**Stage 2 — Frontend builder:** Installs pnpm workspace deps, builds SvelteKit with `adapter-node`. All runtime dependencies (pocketbase, d3, shared) are bundled into the build output by adapter-node's Rollup step — no `node_modules` needed at runtime.

**Stage 3 — Runtime:** Alpine with the PB binary, migrations, SvelteKit build, proxy, and entrypoint. No build tools or `node_modules`.

## Startup sequence (entrypoint.sh)

1. Capture Railway's `PORT` env var (before anything overrides it)
2. Run `pocketbase migrate up` to apply schema migrations
3. Upsert superuser if `PB_ADMIN_EMAIL` and `PB_ADMIN_PASSWORD` are set
4. Start PocketBase on :8090 (background), wait for `/api/health`
5. Start SvelteKit on :3000 (background, `PORT` scoped to subprocess), wait for response
6. Start proxy on Railway's `PORT` (foreground, `exec`)

## Railway setup

### Required

1. **Persistent volume** mounted at `/pb/pb_data` — PocketBase uses SQLite, the database must survive deploys. Without this, all collections and data are lost on every deploy.

   Dashboard: Service → Settings → Volumes → Add Volume → mount path `/pb/pb_data`

   Or via CLI:
   ```
   railway volume add --mount /pb/pb_data
   ```

2. **Environment variables:**

   | Variable | Required | Purpose |
   |----------|----------|---------|
   | `PB_ADMIN_EMAIL` | Yes | PocketBase superuser email |
   | `PB_ADMIN_PASSWORD` | Yes | PocketBase superuser password |

### Configuration (railway.toml)

```toml
[build]
dockerfilePath = "Dockerfile"

[deploy]
healthcheckPath = "/api/health"
healthcheckTimeout = 30
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
```

The healthcheck hits PocketBase's `/api/health` endpoint through the proxy.

## Proxy details

The proxy (`proxy.mjs`) handles two Railway-specific issues:

1. **HTTP/2 header sanitization:** Railway's edge terminates HTTP/2 from browsers and re-encodes the container's HTTP/1.1 responses. Hop-by-hop headers (`connection`, `keep-alive`, `transfer-encoding`, `upgrade`) are forbidden in HTTP/2 (RFC 9113 §8.2.2) and must be stripped.

2. **Accept-Encoding stripping:** PocketBase sends gzip-compressed responses without a `Content-Encoding` header (it relies on chunked framing). The proxy strips `accept-encoding` from upstream requests so PocketBase always responds uncompressed. Railway's edge handles client-facing compression.

## Dependency bundling

All frontend dependencies are in `devDependencies` in `frontend/package.json`. This is intentional.

`@sveltejs/adapter-node` externalizes everything in `dependencies` and expects `node_modules` at runtime. With pnpm workspaces, `node_modules` entries are symlinks to the pnpm store — these break when copied to the Docker runtime container. Keeping deps in `devDependencies` causes adapter-node to bundle them into the server output.

`ssr.noExternal` in `vite.config.ts` ensures Vite also bundles `pocketbase` and `@oop-draft-2/shared` during the SSR build step (before adapter-node runs).

## PocketBase admin UI

Accessible at `/_/` in production (e.g., `https://your-app.up.railway.app/_/`). Login with the superuser credentials set via environment variables.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `EADDRINUSE :3000` | `PORT` env var leaked to proxy | Ensure `PORT=3000` is scoped to the SvelteKit subprocess in entrypoint.sh, not exported globally |
| `ERR_MODULE_NOT_FOUND: pocketbase` | adapter-node externalized it | Move package to `devDependencies`, keep in `ssr.noExternal` |
| Blank page at `/_/` | Proxy forwarding gzip without Content-Encoding | Proxy must strip `accept-encoding` from upstream requests |
| `ERR_HTTP2_PROTOCOL_ERROR` on assets | Hop-by-hop headers forwarded | Proxy must strip `connection`, `keep-alive`, `transfer-encoding` from responses |
| All collections return 404 | No persistent volume | Attach a Railway volume to `/pb/pb_data` |
| 500 on server-rendered pages | PB collection fetch fails | Wrap PB calls in try/catch in `+page.server.ts` load functions |

## Alternative: two-service architecture

Instead of one container with a proxy, you can run PocketBase and SvelteKit as separate Railway services. This avoids the proxy entirely but requires:

- A public PocketBase URL
- CORS configuration on PocketBase
- The frontend's `POCKETBASE_URL` env var pointing to the PocketBase service
- Two Railway services (separate billing, scaling, volumes)

The single-container approach is simpler for this project's scale.
