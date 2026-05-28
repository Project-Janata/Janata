#!/usr/bin/env bash
# setup-local-demo.sh — one-shot LOCAL demo/test setup.
#
# Migrates + seeds a LOCAL D1 (no Cloudflare login, never touches prod/remote)
# with sample centers/events + 5 role accounts, so the app runs locally with the
# Developer Mode role switcher. After this, run `npm run dev`.
#
# Usage:  bash scripts/dev/setup-local-demo.sh
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

CFG="packages/backend/wrangler.toml"
DB="chinmaya-janata-db"            # --local sandboxes this; nothing remote is touched
PW="PreviewTest2026!"
CENTER="c1000001-0000-0000-0000-000000000001"   # Chinmaya Mission Boston (seeded)
# Data-only migrations assume mid-history column orders; skip them (same as the
# preview setup) and let seed_preview_data.sql provide the demo data.
SKIP="0002 0007 0008 0010 0012 0013"

echo "▶ (1/5) npm install"
npm install >/dev/null

echo "▶ (2/5) reset local D1 + apply schema migrations"
rm -rf packages/backend/.wrangler/state 2>/dev/null || true
for f in migrations/0[0-9][0-9][0-9]_*.sql; do
  num="$(basename "$f")"; num="${num%%_*}"
  if echo " $SKIP " | grep -q " $num "; then continue; fi
  echo "  → $(basename "$f")"
  npx wrangler d1 execute "$DB" --local --file="$f" --config "$CFG" >/dev/null
done

echo "▶ (3/5) seed centers + events"
npx wrangler d1 execute "$DB" --local --file=migrations/seed_preview_data.sql --config "$CFG" >/dev/null

echo "▶ (4/5) start a temp backend to register the 5 role accounts"
( cd packages/backend && npx wrangler dev --port 8787 >/tmp/janata-seed-backend.log 2>&1 & )
API="http://localhost:8787/api"
ok=""
for i in $(seq 1 40); do curl -fsS "$API/centers?limit=1" >/dev/null 2>&1 && { ok=1; break; }; sleep 2; done
[ -n "$ok" ] || { echo "✗ temp backend didn't come up — see /tmp/janata-seed-backend.log"; exit 1; }
for r in unverified member sevak brahmachari admin; do
  curl -fsS -X POST "$API/auth/register" -H 'Content-Type: application/json' \
    -d "{\"username\":\"$r@chinmayajanata.org\",\"password\":\"$PW\"}" >/dev/null 2>&1 || true
done

echo "▶ (5/5) elevate roles + complete profiles (so logins land on Home)"
npx wrangler d1 execute "$DB" --local --config "$CFG" --command "
UPDATE users SET verification_level=30,  first_name='Unverified', last_name='Demo', profile_complete=1 WHERE username='unverified@chinmayajanata.org';
UPDATE users SET verification_level=45,  center_id='$CENTER', first_name='Member', last_name='Demo', profile_complete=1 WHERE username='member@chinmayajanata.org';
UPDATE users SET verification_level=54,  center_id='$CENTER', first_name='Sevak', last_name='Demo', profile_complete=1 WHERE username='sevak@chinmayajanata.org';
UPDATE users SET verification_level=108, center_id='$CENTER', first_name='Brahmachari', last_name='Demo', profile_complete=1 WHERE username='brahmachari@chinmayajanata.org';
UPDATE users SET verification_level=110, center_id='$CENTER', first_name='Admin', last_name='Demo', profile_complete=1 WHERE username='admin@chinmayajanata.org';
" >/dev/null
pkill -f "wrangler dev --port 8787" 2>/dev/null || true
sleep 1

echo
echo "✓ Local demo DB ready (5 roles + 10 centers + 4 events seeded)."
echo "  Next:  npm run dev      # web → http://localhost:8081 ; press 'i' for iOS sim"
echo "  Sign-in screen → bottom-left circle → pick a role, or 'New user'."
echo "  Manual login (password: $PW):"
echo "    unverified@ / member@ / sevak@ / brahmachari@ / admin@ chinmayajanata.org"
