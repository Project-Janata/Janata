# Release cutover — v2 → main

The recurring runbook for cutting a release from the `v2` development branch
to `main`. Follow these steps in order. Each step is safe to re-run.

## Why this exists

- CI does NOT auto-apply migrations. They land in `migrations/` on `v2` as
  PRs merge, but the live D1 schema only changes when somebody runs
  `wrangler d1 execute --remote --file=…`.
- Prod and staging workers share one D1 (`database_id: d38b4cd2-...`). So
  every schema change affects both environments simultaneously.
- `deploy.yml` deploys the **staging Worker** on every push to `main` and
  the **production Worker** on manual `workflow_dispatch`. Neither runs
  migrations.

The net effect: **a migration applied at the wrong time can put deployed
code and live schema out of sync.** The safe order is *apply migrations
first, then ship code*.

## Pre-flight (run this anytime you're thinking about cutting a release)

```bash
npm run db:cutover-status
```

It prints:
- how far `v2` is ahead of `main` (commits, PRs)
- which migrations on `v2` haven't been applied to prod D1 yet
- whether any of them touch canon-tier tables (and thus need a snapshot)
- the exact apply commands in order

If output says "no pending migrations, no commits ahead" — there's nothing
to release.

## The eight-step cutover

### 1. Verify v2 is healthy

```bash
git checkout v2 && git pull origin v2
bash .ralph/verify.sh
```

All five gates green. If anything fails, fix on v2 before continuing.

### 2. Snapshot canon-tier data (if any pending migration touches it)

`db:cutover-status` flags this with a ⚠. If you see the flag:

```bash
npm run db:snapshot -- --remote
# → data/snapshots/<utc-stamp>/{centers,events}.sql
```

If no canon-tier migration is pending you can skip this, but a weekly
snapshot regardless is cheap insurance.

### 3. Apply pending migrations to the shared prod D1

Use the apply block that `db:cutover-status` printed. It looks like:

```bash
npx wrangler d1 execute chinmaya-janata-db \
  --file=migrations/0020_xxx.sql \
  --config packages/backend/wrangler.toml
# repeat per pending file in numerical order
```

Note: no `--local` flag. Without it, `wrangler d1 execute` hits the
remote D1. This is the only step that changes prod schema.

If any migration errors:
- Tier 1 (canon) failure → STOP. Use `npm run db:restore -- --remote
  data/snapshots/<latest>` to revert the canon data, fix the migration on
  v2, re-run pre-flight from step 1.
- Tier 2 (disposable) failure → usually a non-idempotent re-apply. Inspect
  the error; if the table state matches what the migration was trying to
  create, you can skip and move on.

### 4. Open the v2 → main PR

```bash
gh pr create --repo Project-Janata/Janata \
  --base main --head v2 \
  --title "release: v2 → main ($(date -u +%Y-%m-%d))" \
  --body-file - <<EOF
Cutover release of all v2 work since last main release.

Migrations applied (already done in step 3):
$(npm run db:cutover-status --machine 2>/dev/null | grep '^migrations/' | sed 's/^/  - /')

Auto-deploy: deploy.yml will run on merge → staging Worker.
Prod deploy: run \`gh workflow run Deploy -f environment=production\` after staging verifies.
EOF
```

### 5. Merge

```bash
gh pr merge <PR-num> --squash --repo Project-Janata/Janata
```

`deploy.yml` triggers automatically. Staging Worker redeploys against
the (already-migrated) D1. Should be healthy because step 3 ran first.

### 6. Verify staging Worker against the new schema

Quick smoke against the staging endpoint:

```bash
curl -sf https://api.chinmayajanata.org/api/centers >/dev/null && echo "✓ centers ok"
curl -sf https://api.chinmayajanata.org/api/fetchAllEvents >/dev/null && echo "✓ events ok"
```

(Note: the live `api.chinmayajanata.org` is the production Worker, which
won't have redeployed yet. To hit staging, use the staging Worker URL
from the deploy.yml output — `chinmaya-janata-api-staging.<account>.workers.dev`
or whatever route is configured.)

If staging is broken, you can roll back the migration with `db:restore`
and revert the v2→main merge before deploying prod.

### 7. Deploy production Worker

```bash
gh workflow run Deploy -f environment=production --repo Project-Janata/Janata
```

This triggers the manual prod deploy. Code now uses new schema; D1 is
already migrated; everything aligns.

### 8. Post-release smoke + announce

```bash
# Smoke production
curl -sf https://api.chinmayajanata.org/api/centers >/dev/null && echo "✓ prod centers"

# Announce in #product-updates via the Ralph bot
npm run db:cutover-status --post-slack
```

(`--post-slack` is optional and uses the Janata Developer Agent bot to
publish a one-line "v2 → main released, N migrations applied" message.)

## Rollback paths

**Prod Worker code is bad** → re-run `gh workflow run Deploy` against the
prior main commit (`gh workflow run Deploy -f environment=production
-f ref=<prior-sha>`). Schema stays migrated; old code reads new schema
fine for additive migrations.

**A canon-tier migration corrupted data** → `npm run db:restore -- --remote
data/snapshots/<latest>` brings `centers` + `events` back to the pre-cutover
state. Then revert the v2 commit that introduced the bad migration.

**A disposable-tier migration broke things** → re-run the migration with
a corrective DROP+CREATE on v2, re-cut a fresh release. The data in those
tables was disposable anyway.

## What this runbook does NOT cover

- **Frontend (Cloudflare Pages) deploys** — Pages auto-deploys `main` via
  its Git integration, separately from `deploy.yml`. No action needed.
- **Mobile app builds** — EAS Build is a separate flow (`npm run
  eas:build:ios`). Schedule those before the MSC handoff window.
- **Hotfixes against main** — out of scope. If main is broken and you can't
  wait for v2, branch off main, fix, PR to main, merge, deploy. Then
  rebase v2 on the new main.

## See also

- [`migrations/README.md`](../migrations/README.md) — tier policy, numbering, per-file apply commands
- [`.ralph/README.md`](../.ralph/README.md) — runner workflow per story
- Memory: `project_d1_shared_prod_staging`, `reference_preview_backend_topology`
