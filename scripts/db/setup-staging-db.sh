#!/usr/bin/env bash
# scripts/db/setup-staging-db.sh: provision the isolated staging D1.
#
# The staging worker (wrangler.staging.toml) auto-deploys on every push to main.
# It binds chinmaya-janata-db-staging, which is SEPARATE from the production
# database, so staging writes never touch real user data (see issue #406).
#
# Applies every schema migration (0001 → latest) against the staging database,
# then loads real centers + demo data so the staging API has something to serve.
#
# Safe to re-run only on a FRESH `wrangler d1 create chinmaya-janata-db-staging`.
# To start over: delete + recreate the D1, then run this once.
#
# Prereq: wrangler authed (npx wrangler login) and the database_id in
# packages/backend/wrangler.staging.toml pointing at the staging D1.
#
# Usage: bash scripts/db/setup-staging-db.sh

set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

CONFIG="packages/backend/wrangler.staging.toml"
DB_NAME="chinmaya-janata-db-staging"

if grep -q 'database_id = "d38b4cd2-963b-45eb-9f83-1e72f9d3aa5d"' "$CONFIG"; then
  echo "✗ wrangler.staging.toml still points at the PRODUCTION database_id." >&2
  echo "  Rebind it to the staging D1 before running this script." >&2
  exit 1
fi

# Data-only migrations are SKIPPED: they seed real Chinmaya data and several
# assume column orderings that only held mid-history (e.g. 0002 inserts a
# `website` value before 0003 adds the column). On a clean replay they fail,
# and staging replaces their data with the seed files below anyway. We apply
# only the schema-defining migrations (CREATE/ALTER), in order.
SKIP_DATA_ONLY="0002 0007 0008 0010 0012 0013"

echo "▶ Applying SCHEMA migrations to $DB_NAME (fresh staging DB)"
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
echo "▶ Loading demo events (on top of real centers)"
npx wrangler d1 execute "$DB_NAME" --remote --file=migrations/seed_preview_data.sql --config "$CONFIG" >/dev/null 2>&1 \
  || { echo "✗ FAILED seeding demo data" >&2; exit 1; }

echo
echo "✓ Staging DB ready. Centers + events seeded."
echo "  Remember to set the staging worker secrets (once):"
echo "    npx wrangler secret put JWT_SECRET         --config $CONFIG"
echo "    npx wrangler secret put JWT_REFRESH_SECRET --config $CONFIG"
echo "    npx wrangler secret put RESEND_API_KEY     --config $CONFIG"
