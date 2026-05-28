# v2 isolated preview — runbook

Stand up the entire v2 sprint on a **fully isolated** preview environment: its own D1 (zero prod-data contamination), its own worker, its own Pages URL. Share the URL with the team to test v2 without touching `main`/prod.

**Topology this creates:**
```
v2preview.project-janatha.pages.dev   (Pages preview branch — v2 frontend build)
        │  EXPO_PUBLIC_API_BASE_URL
        ▼
chinmaya-janata-api-v2preview.<acct>.workers.dev/api   (v2 backend worker)
        │  DB binding
        ▼
chinmaya-janata-db-v2preview   (NEW isolated D1 — dummy data only)
```

Prod (`chinmayajanata.org` ← `main`) is never touched. The shared-D1 staging trap is avoided because this uses a brand-new database.

---

## 0. One-time auth (this machine)

```bash
npx wrangler login        # opens browser OAuth; pick the Cloudflare account that owns project-janatha
npx wrangler whoami       # confirm the right account + that workers.dev is enabled
```

> If `whoami` shows the wrong account, `npx wrangler logout` and retry.

---

## 1. Create the isolated D1

```bash
cd ~/Code/Project-Janatha
git checkout v2 && git pull        # (or stay on the branch carrying this runbook)
npx wrangler d1 create chinmaya-janata-db-v2preview
```

Copy the `database_id` from the output and paste it over `PASTE_PREVIEW_DB_ID_HERE` in `packages/backend/wrangler.preview.toml` (line ~24).

---

## 2. Provision the DB (migrations + dummy data)

```bash
bash scripts/db/setup-preview-db.sh
```

This applies every migration `0001 → 0023` in order against the fresh preview DB, then loads `seed_preview_data.sql` (10 centers + 4 events with the badge/verified flags set). Idempotent only on a fresh DB — to redo, delete + recreate the D1 and re-run.

Verify:
```bash
npx wrangler d1 execute chinmaya-janata-db-v2preview --remote \
  --command "SELECT count(*) AS centers FROM centers; SELECT count(*) AS events FROM events" \
  --config packages/backend/wrangler.preview.toml
# → centers: 10, events: 4
```

---

## 3. Deploy the preview backend worker

```bash
npx wrangler deploy --config packages/backend/wrangler.preview.toml
```

**Copy the deployed URL** from the output — it'll be:
```
https://chinmaya-janata-api-v2preview.<your-account>.workers.dev
```

Smoke it:
```bash
PREVIEW_API="https://chinmaya-janata-api-v2preview.<your-account>.workers.dev/api"
curl -s "$PREVIEW_API/centers?limit=3" | jq '{count:(.centers|length), total, limit, offset}'
# → {"count":3,"total":10,"limit":3,"offset":0}
```

---

## 4. Build the frontend pointed at the preview backend

(I can drive this step for you — it's a local build, no auth needed.)

```bash
cd packages/frontend
EXPO_PUBLIC_API_BASE_URL="https://chinmaya-janata-api-v2preview.<your-account>.workers.dev/api" \
EXPO_PUBLIC_POSTHOG_KEY="" \
  npm run build
cd ../..
rm -rf dist && cp -R packages/frontend/dist dist
node scripts/generate-sitemap.cjs   # optional; uses prod API for sitemap, harmless
```

> `EXPO_PUBLIC_POSTHOG_KEY=""` keeps preview traffic out of the prod PostHog project. Leave it empty for the preview build.

---

## 5. Deploy the preview frontend to a Pages branch

```bash
npx wrangler pages deploy dist --project-name project-janatha --branch v2preview
```

URL: `https://v2preview.project-janatha.pages.dev`

CORS already allows `*.project-janatha.pages.dev` (checked in `app.ts`), so the preview frontend → preview backend call works with no extra config.

---

## 6. Create a test user on the preview (for profile + RSVP testing)

The seed has no users (passwords need real PBKDF2 hashes). Make one via the preview API:

```bash
PREVIEW_API="https://chinmaya-janata-api-v2preview.<your-account>.workers.dev/api"
# Register
curl -s -X POST "$PREVIEW_API/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"username":"testsevak","password":"Preview123!"}' | jq

# Then sign in on the preview URL with testsevak / Preview123!,
# go to Edit Profile, and fill school/work/region/lookingFor to test #210.
```

To test the **official badge** (#192), the event creator needs `verification_level >= 54` (SEVAK). Either bump the test user directly:
```bash
npx wrangler d1 execute chinmaya-janata-db-v2preview --remote \
  --command "UPDATE users SET verification_level = 54 WHERE username = 'testsevak'" \
  --config packages/backend/wrangler.preview.toml
```
…then create an event as that user — it'll get `is_official = 1`.

---

## 7. Smoke the full surface + share

```bash
SMOKE_BASE_URL="$PREVIEW_API" bash scripts/smoke-v2.sh
```

Then share `https://v2preview.project-janatha.pages.dev` with the team. Click-through checklist:
- [ ] Home — greeting, featured event, "Latest on your boards" empty-state, Coming Up list (#199)
- [ ] Explore — Events + Centers tabs, map, no Seva tab
- [ ] Center detail — view-source shows JSON-LD (#253), back/share have a11y labels (#108)
- [ ] Event detail — Bhagavad Gita Study; "Members Only" event gates guest RSVP (#191)
- [ ] Profile → Edit — school/work/region/lookingFor fields (#210)
- [ ] `curl $PREVIEW_API/fetchCenter?centerID=…` GET alias works (#264)

---

## Teardown (when done testing)

```bash
# Delete the preview worker + D1 so they don't linger
npx wrangler delete --config packages/backend/wrangler.preview.toml
npx wrangler d1 delete chinmaya-janata-db-v2preview
# Pages preview branch can be left or deleted from the CF dashboard
```

---

## Why not staging?

`wrangler.staging.toml` binds to the **prod D1** (`d38b4cd2-…`). Deploying v2 there would run v2 migrations against the production database and mix test writes into real data. This preview setup exists specifically to avoid that — its own D1 is the whole point.
