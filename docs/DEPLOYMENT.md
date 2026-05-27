# Deployment Guide

Om Sri Chinmaya Sadgurave Namaha. Om Sri Gurubyo Namaha.

The app runs as **two independent Cloudflare services**:

- **Frontend** — static Expo web export on **Cloudflare Pages**
- **Backend** — Hono API on a standalone **Cloudflare Worker** with **D1**

## Architecture

```
Browser
  ├── https://chinmayajanata.org  (CNAME → https://project-janatha.pages.dev)
  │     └── Cloudflare Pages "project-janatha" (static assets only)
  │
  └── https://api.chinmayajanata.org/api/*
        └── Cloudflare Worker "chinmaya-janata-api" (Hono)
              └── D1 database (SQLite)
```

Frontend and backend deploy independently — a backend bug fix does not require a frontend rebuild, and vice versa.

## Prerequisites

- A [Cloudflare account](https://dash.cloudflare.com/sign-up)
- Node.js >= 20, npm >= 10
- Wrangler CLI (installed as a dev dependency)

## First-Time Setup

### 1. Create the D1 database

```bash
npm run d1:create
```

Copy the `database_id` from the output and update `packages/backend/wrangler.toml`.

### 2. Run migrations

```bash
npm run d1:migrate
```

### 3. Set backend secrets

These are stored securely by Cloudflare and injected at runtime into the Worker:

```bash
cd packages/backend
npx wrangler secret put JWT_SECRET
npx wrangler secret put JWT_REFRESH_SECRET
```

## Deploying

### Backend only

```bash
npm run deploy:backend
```

Runs `wrangler deploy` from `packages/backend/`. The Worker URL is printed in the output.

### Frontend only

```bash
npm run deploy:frontend
```

Builds the Expo web export, copies to `dist/`, and runs `wrangler pages deploy dist`.

### Preview (frontend)

```bash
npm run deploy:frontend:preview
```

### Both at once

```bash
npm run deploy
```

Deploys backend first, then frontend.

## Local Development

```bash
npm run dev
```

Runs both services concurrently:

| Service  | URL                      | Command                              |
|----------|--------------------------|--------------------------------------|
| Backend  | http://localhost:8787     | `wrangler dev` in `packages/backend` |
| Frontend | http://localhost:8081     | `expo start` in `packages/frontend`  |

You can also run them independently:

```bash
npm run dev:backend    # just the API
npm run dev:frontend   # just the Expo dev server
```

## Environment & Bindings

### Backend Worker (`chinmaya-janata-api`)

| Binding              | Type        | Description                        |
|----------------------|-------------|------------------------------------|
| `DB`                 | D1 Database | SQLite database for all app data   |
| `JWT_SECRET`         | Secret      | Signing key for access tokens      |
| `JWT_REFRESH_SECRET` | Secret      | Signing key for refresh tokens     |

Configured in `packages/backend/wrangler.toml` (D1) and via `npx wrangler secret put` (secrets).

### Frontend Pages (`project-janatha` — served behind `chinmayajanata.org`)

| Variable                    | Type      | Description                             |
|-----------------------------|-----------|-----------------------------------------|
| `EXPO_PUBLIC_API_BASE_URL`  | Build env | Overrides the default backend API URL   |
| `EXPO_PUBLIC_POSTHOG_KEY`   | Build env | PostHog project API key (`phc_…`)       |
| `EXPO_PUBLIC_POSTHOG_HOST`  | Build env | Optional; default `https://us.i.posthog.com` |

Set at build time if needed. The default API URL points to the production Worker URL.

**PostHog:** Add the same values you use in `packages/frontend/.env` to **GitHub → Repository → Settings → Secrets and variables → Actions** (e.g. `EXPO_PUBLIC_POSTHOG_KEY`). The production workflow passes them into `npm run build:frontend` so the static bundle includes analytics. If a secret is omitted, the app still runs (PostHog stays disabled); the crash-only case was fixed in code.

## CI/CD

GitHub Actions (`.github/workflows/deploy.yml`) runs two parallel jobs on push to `main`:

- **deploy-backend** — typechecks and deploys the Worker
- **deploy-frontend** — builds Expo and deploys to Pages

## Monitoring

- **Backend** — Cloudflare Dashboard → Workers & Pages → chinmaya-janata-api → logs and analytics
- **Frontend** — Cloudflare Dashboard → Workers & Pages → project-janatha → deployments (custom domain: chinmayajanata.org)
- **D1** — Cloudflare Dashboard → Workers & Pages → D1 → chinmaya-janata-db → query browser
