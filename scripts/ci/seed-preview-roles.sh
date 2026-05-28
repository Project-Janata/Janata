#!/usr/bin/env bash
# seed-preview-roles.sh — create role-based test users + sample board content
# on the ISOLATED v2 preview. Called by deploy-v2preview.sh after the worker is
# live. Never touches prod (operates only against the preview API + preview D1).
#
# Args: API_BASE  PREVIEW_DB_NAME  WRANGLER_CONFIG  PASSWORD
set -uo pipefail

API="$1"; DB="$2"; CONFIG="$3"; PW="$4"
CENTER="c1000001-0000-0000-0000-000000000001"   # Chinmaya Mission Boston (seeded)

reg() {
  curl -fsS -X POST "$API/auth/register" -H 'Content-Type: application/json' \
    -d "{\"username\":\"$1\",\"password\":\"$PW\"}" >/dev/null 2>&1 \
    && echo "  registered $1" || echo "  (already exists / skipped) $1"
}
sql()  { npx wrangler d1 execute "$DB" --remote --config "$CONFIG" --command "$1" >/dev/null; }
tok()  { curl -fsS -X POST "$API/auth/authenticate" -H 'Content-Type: application/json' \
           -d "{\"username\":\"$1\",\"password\":\"$PW\"}" \
           | python3 -c 'import sys,json;print(json.load(sys.stdin).get("token",""))' 2>/dev/null || true; }

echo "▶ registering role users"
for r in unverified member sevak brahmachari admin; do reg "${r}@chinmayajanata.org"; done

echo "▶ elevating verification levels + completing profiles (so role logins land on Home)"
# verification_level: UNVERIFIED=30, NORMAL=45, SEVAK=54, BRAHMACHARI=108, ADMIN≥107.
# first/last name + profile_complete=1 so each role skips onboarding and lands on Home;
# the tier difference (what's gated) is verification_level. unverified stays lvl 30 so
# the verified-gate is testable, but still gets a profile so it lands in-app.
sql "UPDATE users SET verification_level=30,  first_name='Unverified', last_name='Demo', profile_complete=1 WHERE username='unverified@chinmayajanata.org'"
sql "UPDATE users SET verification_level=45,  center_id='$CENTER', first_name='Member', last_name='Demo', profile_complete=1 WHERE username='member@chinmayajanata.org'"
sql "UPDATE users SET verification_level=54,  center_id='$CENTER', first_name='Sevak', last_name='Demo', profile_complete=1 WHERE username='sevak@chinmayajanata.org'"
sql "UPDATE users SET verification_level=108, center_id='$CENTER', first_name='Brahmachari', last_name='Demo', profile_complete=1 WHERE username='brahmachari@chinmayajanata.org'"
sql "UPDATE users SET verification_level=110, center_id='$CENTER', first_name='Admin', last_name='Demo', profile_complete=1 WHERE username='admin@chinmayajanata.org'"

echo "▶ seeding sample board posts + a moderation report (best-effort)"
MT="$(tok member@chinmayajanata.org)"
UT="$(tok unverified@chinmayajanata.org)"
PID=""
if [ -n "$MT" ]; then
  RESP="$(curl -fsS -X POST "$API/boards/center/$CENTER/posts" -H "Authorization: Bearer $MT" \
    -H 'Content-Type: application/json' \
    -d '{"body":"Welcome to the Boston CHYK board! 🙏 Carpools for MSC are forming here."}' 2>/dev/null || true)"
  PID="$(echo "$RESP" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("post",{}).get("id",""))' 2>/dev/null || true)"
  curl -fsS -X POST "$API/boards/center/$CENTER/posts" -H "Authorization: Bearer $MT" \
    -H 'Content-Type: application/json' \
    -d '{"body":"Anyone driving up from the South Bay on Aug 1? 🚗"}' >/dev/null 2>&1 || true
fi
# Populate the moderation queue so admin/sevak have something to action.
if [ -n "$PID" ] && [ -n "$UT" ]; then
  curl -fsS -X POST "$API/boards/posts/$PID/report" -H "Authorization: Bearer $UT" \
    -H 'Content-Type: application/json' \
    -d '{"reason":"demo report — exercise the moderation queue"}' >/dev/null 2>&1 || true
fi

echo "✓ roles + sample content seeded"
