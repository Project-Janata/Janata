#!/usr/bin/env bash
# deploy-v2preview.sh — headless, fully-isolated v2 preview deploy.
#
# Runs in GitHub Actions with CLOUDFLARE_API_TOKEN (no interactive login).
# Topology (NEVER touches prod):
#   v2preview.project-janatha.pages.dev  (Pages branch alias — v2 frontend)
#        │  EXPO_PUBLIC_API_BASE_URL
#        ▼
#   chinmaya-janata-api-v2preview.chinmayajanata.workers.dev/api  (v2 worker)
#        │  DB binding
#        ▼
#   chinmaya-janata-db-v2preview  (isolated D1 — recreated fresh each run)
#
# Prod (chinmayajanata.org / chinmaya-janata-db d38b4cd2 / api.chinmayajanata.org)
# is never referenced. Guards below hard-fail if a prod identifier appears.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

CONFIG="packages/backend/wrangler.preview.toml"
DB_NAME="chinmaya-janata-db-v2preview"
WORKER_NAME="chinmaya-janata-api-v2preview"
API="https://chinmaya-janata-api-v2preview.chinmayajanata.workers.dev/api"
PAGES_PROJECT="project-janatha"
PAGES_BRANCH="v2preview"
PROD_DB_ID="d38b4cd2-963b-45eb-9f83-1e72f9d3aa5d"
PW="PreviewTest2026!"

WR() { npx wrangler "$@"; }

# ── Safety guards (defense in depth — refuse to act anywhere near prod) ──
grep -q "$DB_NAME" "$CONFIG"     || { echo "✗ guard: $CONFIG missing $DB_NAME"; exit 1; }
[[ "$DB_NAME"     == *v2preview* ]] || { echo "✗ guard: DB name"; exit 1; }
[[ "$WORKER_NAME" == *v2preview* ]] || { echo "✗ guard: worker name"; exit 1; }
if grep -q "$PROD_DB_ID" "$CONFIG"; then echo "✗ guard: preview config references PROD D1 id"; exit 1; fi

echo "▶ (1/7) Reset isolated preview D1 in place (drop all app tables, keep the DB)"
# Reuse the existing isolated DB (id in $CONFIG) — deterministic, no D1 create
# perms needed, no id churn. Verbose on purpose so any token/permission issue is
# visible. Guard the id first.
CFG_ID="$(grep -oE 'database_id = "[0-9a-fA-F-]{36}"' "$CONFIG" | grep -oiE '[0-9a-f-]{36}' | head -1)"
[[ -n "$CFG_ID" && "$CFG_ID" != "$PROD_DB_ID" ]] || { echo "✗ guard: config D1 id missing or is PROD ($CFG_ID)"; exit 1; }
echo "  preview D1 id = $CFG_ID"
echo "  --- D1 access probe (CI token) ---"
WR d1 execute "$DB_NAME" --remote --config "$CONFIG" --command "SELECT 1 AS ok;"
echo "  --- dropping all app tables ---"
WR d1 execute "$DB_NAME" --remote --config "$CONFIG" --file=migrations/_reset_preview.sql

echo "▶ (2/7b) Apply schema migrations + dummy data (verbose)"
SKIP_DATA_ONLY="0002 0007 0008 0010 0012 0013"
for f in migrations/0[0-9][0-9][0-9]_*.sql; do
  base="$(basename "$f")"; num="${base%%_*}"
  if echo " $SKIP_DATA_ONLY " | grep -q " $num "; then echo "  skip $base (data-only)"; continue; fi
  echo "  → $base"
  WR d1 execute "$DB_NAME" --remote --config "$CONFIG" --file="$f"
done
echo "  → seed_preview_data.sql"
WR d1 execute "$DB_NAME" --remote --config "$CONFIG" --file=migrations/seed_preview_data.sql

echo "▶ (3/7) Deploy preview worker"
WR deploy --config "$CONFIG"

echo "▶ (4/7) Wait for worker health"
ok=""
for i in $(seq 1 20); do
  if curl -fsS "$API/centers?limit=1" >/dev/null 2>&1; then ok=1; echo "  worker healthy"; break; fi
  sleep 3
done
[[ -n "$ok" ]] || { echo "✗ worker did not become healthy at $API"; exit 1; }

echo "▶ (5/7) Seed role users + sample board content"
bash scripts/ci/seed-preview-roles.sh "$API" "$DB_NAME" "$CONFIG" "$PW"

echo "▶ (6/7) Build frontend against the preview API"
EXPO_PUBLIC_API_BASE_URL="$API" npm run build:frontend

echo "▶ (7/7) Deploy frontend to Pages preview branch"
WR pages deploy dist --project-name "$PAGES_PROJECT" --branch "$PAGES_BRANCH" --commit-dirty=true

echo
echo "════════════════════════════════════════════════════════════════"
echo "✓ v2 PREVIEW LIVE → https://${PAGES_BRANCH}.${PAGES_PROJECT}.pages.dev"
echo "  API: $API"
echo "  Logins (password: $PW):"
echo "    unverified@chinmayajanata.org   (lvl 30 — verified-gate testable)"
echo "    member@chinmayajanata.org       (lvl 45 — Boston center)"
echo "    sevak@chinmayajanata.org        (lvl 54 — can moderate + pin)"
echo "    brahmachari@chinmayajanata.org  (lvl 108)"
echo "    admin@chinmayajanata.org        (lvl 110 — full admin + moderation)"
echo "════════════════════════════════════════════════════════════════"
