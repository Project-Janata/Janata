#!/usr/bin/env bash
# scripts/db/setup-preview-db.sh — provision the isolated v2 preview D1.
#
# Applies every migration (0001 → latest) against the preview database, then
# loads dummy data so the preview URL has centers + events to click through.
#
# Safe to re-run: migrations that aren't idempotent will error on a 2nd run,
# so this is meant for a FRESH `wrangler d1 create chinmaya-janata-db-v2preview`.
# To start over: delete + recreate the D1, then run this once.
#
# Prereq: wrangler authed (npx wrangler login) and the database_id pasted into
# packages/backend/wrangler.preview.toml.
#
# Usage: bash scripts/db/setup-preview-db.sh

set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

CONFIG="packages/backend/wrangler.preview.toml"
DB_NAME="chinmaya-janata-db-v2preview"

if grep -q 'database_id = "PASTE_PREVIEW_DB_ID_HERE"' "$CONFIG"; then
  cat <<'ERR' >&2
✗ wrangler.preview.toml still has the placeholder database_id.
  Run first:
    npx wrangler d1 create chinmaya-janata-db-v2preview
  then paste the returned id over PASTE_PREVIEW_DB_ID_HERE in
  packages/backend/wrangler.preview.toml
ERR
  exit 1
fi

# Data-only migrations are SKIPPED: they seed real Chinmaya data and several
# assume column orderings that only held mid-history (e.g. 0002 inserts a
# `website` value before 0003 adds the column). On a clean replay they fail,
# and preview replaces their data with seed_preview_data.sql anyway. We apply
# only the schema-defining migrations (CREATE/ALTER), in order.
SKIP_DATA_ONLY="0002 0007 0008 0010 0012 0013"

echo "▶ Applying SCHEMA migrations to $DB_NAME (fresh preview DB)"
for f in migrations/0[0-9][0-9][0-9]_*.sql; do
  base="$(basename "$f")"
  num="${base%%_*}"
  if echo " $SKIP_DATA_ONLY " | grep -q " $num "; then
    echo "  ↳ skip $base (data-only)"
    continue
  fi
  echo "  → $base"
  npx wrangler d1 execute "$DB_NAME" --remote --file="$f" --config "$CONFIG" >/dev/null 2>&1 \
    || { echo "✗ FAILED on $base" >&2; exit 1; }
done

echo "▶ Loading real centers (packages/backend/src/seed/centers.sql)"
npx wrangler d1 execute "$DB_NAME" --remote --file=packages/backend/src/seed/centers.sql --config "$CONFIG" >/dev/null 2>&1 \
  || { echo "✗ FAILED seeding real centers" >&2; exit 1; }
echo "▶ Loading preview demo events (on top of real centers)"
npx wrangler d1 execute "$DB_NAME" --remote --file=migrations/seed_preview_data.sql --config "$CONFIG" >/dev/null 2>&1 \
  || { echo "✗ FAILED seeding preview data" >&2; exit 1; }

echo
echo "✓ Preview DB ready. Centers + events seeded."
echo "  Next: deploy the preview worker:"
echo "    npx wrangler deploy --config $CONFIG"
