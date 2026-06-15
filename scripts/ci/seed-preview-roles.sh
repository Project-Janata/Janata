#!/usr/bin/env bash
# seed-preview-roles.sh — create role-based test users + sample board content
# on the ISOLATED v2 preview. Called by deploy-v2preview.sh after the worker is
# live. Never touches prod (operates only against the preview API + preview D1).
#
# Args: API_BASE  PREVIEW_DB_NAME  WRANGLER_CONFIG  PASSWORD
set -uo pipefail

API="$1"; DB="$2"; CONFIG="$3"; PW="$4"
# Real seeded center (matches the official Chinmaya center list, c0000001- prefix).
# Chinmaya Vrindavan also has seeded events, so the demo users' home center shows
# both a populated board AND upcoming events. The old c1000001- Boston id was
# orphaned by the center-list id-prefix change, so all board seeding 404'd.
CENTER="c0000001-0000-0000-0000-000000000081"   # Chinmaya Vrindavan (real, has events)

# Preview is invite-only (REQUIRE_INVITE_CODE="true"), so role users must
# register with a valid code. QA_CODE is a multi-use cohort code we seed below;
# it doubles as the manual-QA invite for getting an account through the gate.
QA_CODE="QA-TEST"
reg() {
  curl -fsS -X POST "$API/auth/register" -H 'Content-Type: application/json' \
    -d "{\"username\":\"$1\",\"password\":\"$PW\",\"inviteCode\":\"$QA_CODE\"}" >/dev/null 2>&1 \
    && echo "  registered $1" || echo "  (already exists / skipped) $1"
}
sql()  { npx wrangler d1 execute "$DB" --remote --config "$CONFIG" --command "$1" >/dev/null; }
tok()  { curl -fsS -X POST "$API/auth/authenticate" -H 'Content-Type: application/json' \
           -d "{\"username\":\"$1\",\"password\":\"$PW\"}" \
           | python3 -c 'import sys,json;print(json.load(sys.stdin).get("token",""))' 2>/dev/null || true; }

echo "▶ seeding QA invite code ($QA_CODE) — multi-use, never expires, preview-only"
# verification_level 45 = NORMAL_USER; max_uses NULL = unlimited. is_active=1.
sql "INSERT OR IGNORE INTO invite_codes (code, label, verification_level, is_active, max_uses) VALUES ('$QA_CODE', 'Manual QA + role seeding', 45, 1, NULL)"

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
    -d '{"body":"Welcome to the Chinmaya Vrindavan board! 🙏 Carpools for MSC are forming here."}' 2>/dev/null || true)"
  PID="$(echo "$RESP" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("post",{}).get("id",""))' 2>/dev/null || true)"
  curl -fsS -X POST "$API/boards/center/$CENTER/posts" -H "Authorization: Bearer $MT" \
    -H 'Content-Type: application/json' \
    -d '{"body":"Anyone driving up from the South Bay on Aug 1? 🚗"}' >/dev/null 2>&1 || true
  # One post with a photo so the board/feed image rendering is visible out of the
  # box (and guards the image-URL fix). Unsplash CDN, same source as the event seed.
  curl -fsS -X POST "$API/boards/center/$CENTER/posts" -H "Authorization: Bearer $MT" \
    -H 'Content-Type: application/json' \
    -d '{"body":"Beautiful turnout at last week'"'"'s satsang 🪔 grateful for this sangha.","imageUrl":"https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80"}' >/dev/null 2>&1 || true
fi
# Populate the moderation queue so admin/sevak have something to action.
if [ -n "$PID" ] && [ -n "$UT" ]; then
  curl -fsS -X POST "$API/boards/posts/$PID/report" -H "Authorization: Bearer $UT" \
    -H 'Content-Type: application/json' \
    -d '{"reason":"demo report — exercise the moderation queue"}' >/dev/null 2>&1 || true
fi

echo "✓ roles + sample content seeded"
echo
echo "──────────────────────────────────────────────────────────────"
echo " TEST CREDS (preview is invite-only)"
echo "   Invite code : $QA_CODE   (paste at /join to make a fresh account)"
echo "   Role logins : {unverified,member,sevak,brahmachari,admin}@chinmayajanata.org"
echo "   Password    : <the PASSWORD arg passed to this script>"
echo "──────────────────────────────────────────────────────────────"
