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
# Pages PROJECT name is "chinmaya-janata"; its pages.dev domain is
# project-janatha.pages.dev, so --branch v2preview → v2preview.project-janatha.pages.dev.
PAGES_PROJECT="chinmaya-janata"
PAGES_BRANCH="v2preview"
PROD_DB_ID="d38b4cd2-963b-45eb-9f83-1e72f9d3aa5d"
PW="PreviewTest2026!"

WR() { npx wrangler "$@"; }

# ── Safety guards (defense in depth — refuse to act anywhere near prod) ──
grep -q "$DB_NAME" "$CONFIG"     || { echo "✗ guard: $CONFIG missing $DB_NAME"; exit 1; }
[[ "$DB_NAME"     == *v2preview* ]] || { echo "✗ guard: DB name"; exit 1; }
[[ "$WORKER_NAME" == *v2preview* ]] || { echo "✗ guard: worker name"; exit 1; }
if grep -q "$PROD_DB_ID" "$CONFIG"; then echo "✗ guard: preview config references PROD D1 id"; exit 1; fi

echo "▶ (1/7) Resolve isolated preview D1 on the CI token's OWN account (reuse-by-name or create)"
# The old 3150bf63 lived on a different CF account than this token (7403). The
# token now has D1:Edit on its own account, so resolve the preview DB by NAME
# there: reuse if it exists, else create. Then write the id into the config so
# the worker binds it. Never prod (guarded below).
echo "  --- D1 databases visible to this token ---"
WR d1 list 2>&1 | head -20 || true
LIST="$(WR d1 list --json 2>/dev/null || echo '[]')"
DBID="$(printf '%s' "$LIST" | python3 -c 'import sys,json
try:
    d=json.load(sys.stdin)
except Exception:
    d=[]
name="'"$DB_NAME"'"
print(next((x.get("uuid") or x.get("database_id") or "" for x in d if x.get("name")==name), ""))' 2>/dev/null)"
if [ -z "$DBID" ]; then
  echo "  no $DB_NAME on this account — creating it"
  CREATE="$(WR d1 create "$DB_NAME" 2>&1)"; printf '%s\n' "$CREATE"
  DBID="$(printf '%s' "$CREATE" | grep -oiE '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' | head -1)"
fi
[[ -n "$DBID" && "$DBID" != "$PROD_DB_ID" ]] || { echo "✗ could not resolve a non-prod preview D1 id (check D1 perms/account)"; exit 1; }
perl -pi -e "s/database_id = \"[0-9a-fA-F-]+\"/database_id = \"$DBID\"/" "$CONFIG"
echo "  preview D1 id = $DBID"
echo "  --- reset: drop all app tables (idempotent on fresh or existing) ---"
WR d1 execute "$DB_NAME" --remote --config "$CONFIG" --file=migrations/_reset_preview.sql

echo "▶ (2/7b) Apply schema migrations + dummy data (verbose)"
SKIP_DATA_ONLY="0002 0007 0008 0010 0012 0013"
for f in migrations/0[0-9][0-9][0-9]_*.sql; do
  base="$(basename "$f")"; num="${base%%_*}"
  if echo " $SKIP_DATA_ONLY " | grep -q " $num "; then echo "  skip $base (data-only)"; continue; fi
  echo "  → $base"
  WR d1 execute "$DB_NAME" --remote --config "$CONFIG" --file="$f"
done
echo "  → real centers (packages/backend/src/seed/centers.sql)"
WR d1 execute "$DB_NAME" --remote --config "$CONFIG" --file=packages/backend/src/seed/centers.sql
echo "  → seed_preview_data.sql (demo events on top of real centers)"
WR d1 execute "$DB_NAME" --remote --config "$CONFIG" --file=migrations/seed_preview_data.sql

echo "▶ (3/7) Deploy preview worker"
WR deploy --config "$CONFIG"

echo "▶ (3b/7) Set JWT signing secrets (never committed, see #407)"
# JWT_SECRET / JWT_REFRESH_SECRET used to be plaintext [vars] in
# wrangler.preview.toml. They were removed (anyone with repo read could forge
# preview tokens), so the worker now needs them as real secrets. Preview is
# ephemeral, the D1 is reset and role users reseeded every run, so a fresh
# random secret per deploy is fine and keeps this pipeline self-contained (no
# extra CI secret to manage). Set PREVIEW_JWT_SECRET / PREVIEW_JWT_REFRESH_SECRET
# in the env to pin stable values instead. Runs AFTER deploy so the old plaintext
# var is gone first (a name can't be both a var and a secret).
JWT_SECRET_VAL="${PREVIEW_JWT_SECRET:-$(openssl rand -hex 32)}"
JWT_REFRESH_VAL="${PREVIEW_JWT_REFRESH_SECRET:-$(openssl rand -hex 32)}"
printf '%s' "$JWT_SECRET_VAL"  | WR secret put JWT_SECRET         --config "$CONFIG"
printf '%s' "$JWT_REFRESH_VAL" | WR secret put JWT_REFRESH_SECRET --config "$CONFIG"

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
EXPO_PUBLIC_API_BASE_URL="$API" EXPO_PUBLIC_SHOW_DEV_TOOLS=1 npm run build:frontend

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
