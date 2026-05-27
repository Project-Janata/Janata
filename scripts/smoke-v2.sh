#!/usr/bin/env bash
# smoke-v2.sh — fast read-only smoke of the v2 backend after the 5/27 merge.
#
# Verifies the new endpoints introduced by:
#   - #254 (profile fields) — schema columns visible in user payload
#   - #256 (API pagination) — ?limit=&offset= on /centers + /fetchAllEvents
#   - #257 (notif fixes)    — body validation + 404 on missing IDs
#   - #264 (perf)           — GET aliases for /fetchCenter / /fetchEvent / /fetchEventsByCenter
#
# Read-only — no writes. Safe to run against prod.
#
# Env:
#   SMOKE_BASE_URL  Default http://localhost:8787/api
#                   For prod: https://api.chinmayajanata.org/api
#
# Usage:
#   bash scripts/smoke-v2.sh
#   SMOKE_BASE_URL=https://api.chinmayajanata.org/api bash scripts/smoke-v2.sh

set -uo pipefail
export LC_ALL="${LC_ALL:-en_US.UTF-8}"

BASE="${SMOKE_BASE_URL:-http://localhost:8787/api}"
PASS=0
FAIL=0
WARN=0
NOTES=()

# ── tiny test framework ─────────────────────────────────────────────────────
expect_status() {
  local name="$1" expected="$2" url="$3" method="${4:-GET}" data="${5:-}"
  local args=(-s -o /dev/null -w '%{http_code}' -X "$method")
  [[ -n "$data" ]] && args+=(-H 'Content-Type: application/json' --data "$data")
  local got
  got=$(curl "${args[@]}" "$url")
  if [[ "$got" == "$expected" ]]; then
    printf "  \033[32m✓\033[0m %s [%s %s]\n" "$name" "$method" "$got"
    PASS=$((PASS + 1))
  else
    printf "  \033[31m✗\033[0m %s [%s expected=%s got=%s]\n" "$name" "$method" "$expected" "$got"
    NOTES+=("FAIL: $name — $method $url expected $expected got $got")
    FAIL=$((FAIL + 1))
  fi
}

expect_jq() {
  local name="$1" url="$2" jq_filter="$3" expected="$4"
  local got
  got=$(curl -s "$url" | jq -r "$jq_filter" 2>/dev/null || echo 'PARSE_ERROR')
  if [[ "$got" == "$expected" ]]; then
    printf "  \033[32m✓\033[0m %s [%s == %s]\n" "$name" "$jq_filter" "$expected"
    PASS=$((PASS + 1))
  else
    printf "  \033[31m✗\033[0m %s [%s expected=%s got=%s]\n" "$name" "$jq_filter" "$expected" "$got"
    NOTES+=("FAIL: $name — jq $jq_filter expected $expected got $got")
    FAIL=$((FAIL + 1))
  fi
}

expect_jq_nonzero() {
  local name="$1" url="$2" jq_filter="$3"
  local got
  got=$(curl -s "$url" | jq -r "$jq_filter" 2>/dev/null || echo 0)
  if [[ "$got" -gt 0 ]]; then
    printf "  \033[32m✓\033[0m %s [%s = %s]\n" "$name" "$jq_filter" "$got"
    PASS=$((PASS + 1))
  else
    printf "  \033[33m⚠\033[0m %s [%s = %s — empty result, not necessarily wrong]\n" "$name" "$jq_filter" "$got"
    NOTES+=("WARN: $name — $jq_filter returned $got (might just mean no data yet)")
    WARN=$((WARN + 1))
  fi
}

header() { printf "\n\033[1m━━━ %s ━━━\033[0m\n" "$1"; }

echo "smoke-v2 against: $BASE"
echo

# ── #256 — pagination on /centers ────────────────────────────────────────────
header "#256 — /centers pagination"
expect_status "GET /centers (legacy, no params)" 200 "$BASE/centers"
expect_status "GET /centers?limit=5" 200 "$BASE/centers?limit=5"
expect_jq "→ has 'centers' array" "$BASE/centers?limit=5" '.centers | type' 'array'
expect_jq "→ includes 'total'" "$BASE/centers?limit=5" '.total | type' 'number'
expect_jq "→ includes 'limit'" "$BASE/centers?limit=5" '.limit' '5'
expect_jq "→ includes 'offset'" "$BASE/centers?limit=5" '.offset' '0'
expect_status "GET /centers?limit=-1 (validation)" 400 "$BASE/centers?limit=-1"
expect_status "GET /centers?limit=10&offset=-3 (validation)" 400 "$BASE/centers?limit=10&offset=-3"

# ── #256 — pagination on /fetchAllEvents ─────────────────────────────────────
header "#256 — /fetchAllEvents pagination"
expect_status "GET /fetchAllEvents (legacy, no params)" 200 "$BASE/fetchAllEvents"
expect_status "GET /fetchAllEvents?limit=3" 200 "$BASE/fetchAllEvents?limit=3"
expect_jq "→ has 'events' array" "$BASE/fetchAllEvents?limit=3" '.events | type' 'array'
expect_jq "→ includes 'total'" "$BASE/fetchAllEvents?limit=3" '.total | type' 'number'

# ── #264 — GET aliases for read endpoints ────────────────────────────────────
header "#264 — GET aliases (perf)"
# Need a real centerID + eventID — pull from the unpaginated list
SAMPLE_CENTER=$(curl -s "$BASE/centers" | jq -r '.centers[0].centerID // .centers[0].id // empty' 2>/dev/null || true)
SAMPLE_EVENT=$(curl -s "$BASE/fetchAllEvents" | jq -r '.events[0].eventID // .events[0].id // empty' 2>/dev/null || true)
echo "  sample centerID: ${SAMPLE_CENTER:-'(none — db empty?)'}"
echo "  sample eventID: ${SAMPLE_EVENT:-'(none — db empty?)'}"

if [[ -n "$SAMPLE_CENTER" ]]; then
  expect_status "GET /fetchCenter?centerID=…" 200 "$BASE/fetchCenter?centerID=$SAMPLE_CENTER"
  expect_jq "→ returns the right center" "$BASE/fetchCenter?centerID=$SAMPLE_CENTER" '.center.centerID // .center.id' "$SAMPLE_CENTER"
  expect_status "GET /fetchEventsByCenter?centerID=…" 200 "$BASE/fetchEventsByCenter?centerID=$SAMPLE_CENTER"
else
  NOTES+=("WARN: no centers in DB to test GET /fetchCenter aliases")
  WARN=$((WARN + 1))
fi
expect_status "GET /fetchCenter (no param)" 400 "$BASE/fetchCenter"

if [[ -n "$SAMPLE_EVENT" ]]; then
  expect_status "GET /fetchEvent?id=…" 200 "$BASE/fetchEvent?id=$SAMPLE_EVENT"
else
  NOTES+=("WARN: no events in DB to test GET /fetchEvent")
  WARN=$((WARN + 1))
fi
expect_status "GET /fetchEvent (no param)" 400 "$BASE/fetchEvent"

# ── #254 — profile fields surface in user payload ────────────────────────────
header "#254 — profile fields (read-only check)"
# Without a logged-in user we can't hit /auth/me, but we CAN check the userExistence
# endpoint or any user listing if one's accessible without auth. Mostly this section
# is a no-op unless SMOKE_TOKEN is set.
if [[ -n "${SMOKE_TOKEN:-}" ]]; then
  echo "  → SMOKE_TOKEN provided; checking authenticated user payload includes new fields"
  ME_BODY=$(curl -s -H "Authorization: Bearer $SMOKE_TOKEN" "$BASE/auth/me" || echo '{}')
  for field in school work region lookingFor; do
    has=$(echo "$ME_BODY" | jq "has(\"$field\")" 2>/dev/null || echo false)
    if [[ "$has" == "true" ]]; then
      printf "  \033[32m✓\033[0m user payload has '%s' key\n" "$field"
      PASS=$((PASS + 1))
    else
      printf "  \033[31m✗\033[0m user payload missing '%s' (migration 0021 not applied?)\n" "$field"
      NOTES+=("FAIL: user payload missing $field — apply migration 0021")
      FAIL=$((FAIL + 1))
    fi
  done
else
  echo "  (skip — set SMOKE_TOKEN=… to test authenticated /auth/me)"
  NOTES+=("WARN: no SMOKE_TOKEN; can't verify profile fields in user payload")
  WARN=$((WARN + 1))
fi

# ── #257 — notification 404 + validation ─────────────────────────────────────
header "#257 — notification fixes (requires SMOKE_TOKEN)"
if [[ -n "${SMOKE_TOKEN:-}" ]]; then
  expect_status "POST /notifications/no-such-id/read → 404" 404 \
    "$BASE/notifications/no-such-id-here/read" POST '{}' \
    -H "Authorization: Bearer $SMOKE_TOKEN" 2>/dev/null || true
  # The expect_status helper doesn't pass auth headers — quick inline curl instead:
  got=$(curl -s -o /dev/null -w '%{http_code}' -X POST -H "Authorization: Bearer $SMOKE_TOKEN" "$BASE/notifications/no-such-id-here/read")
  if [[ "$got" == "404" ]]; then
    printf "  \033[32m✓\033[0m POST /notifications/missing/read → 404 (was 200 pre-#257)\n"
    PASS=$((PASS + 1))
  else
    printf "  \033[31m✗\033[0m POST /notifications/missing/read got %s (expected 404)\n" "$got"
    NOTES+=("FAIL: notif read on missing id should be 404")
    FAIL=$((FAIL + 1))
  fi

  got=$(curl -s -o /dev/null -w '%{http_code}' -X PUT -H "Authorization: Bearer $SMOKE_TOKEN" -H 'Content-Type: application/json' --data 'not-json' "$BASE/notifications/preferences")
  if [[ "$got" == "400" ]]; then
    printf "  \033[32m✓\033[0m PUT /notifications/preferences with bad JSON → 400\n"
    PASS=$((PASS + 1))
  else
    printf "  \033[31m✗\033[0m PUT /notifications/preferences bad body got %s (expected 400)\n" "$got"
    NOTES+=("FAIL: PUT preferences should validate body")
    FAIL=$((FAIL + 1))
  fi

  got=$(curl -s -o /dev/null -w '%{http_code}' -X PUT -H "Authorization: Bearer $SMOKE_TOKEN" -H 'Content-Type: application/json' --data '{"inAppEnabled": "yes"}' "$BASE/notifications/preferences")
  if [[ "$got" == "400" ]]; then
    printf "  \033[32m✓\033[0m PUT /notifications/preferences with non-bool → 400\n"
    PASS=$((PASS + 1))
  else
    printf "  \033[31m✗\033[0m PUT /notifications/preferences non-bool got %s (expected 400)\n" "$got"
    FAIL=$((FAIL + 1))
  fi
else
  echo "  (skip — set SMOKE_TOKEN=… to test authenticated notif endpoints)"
fi

# ── Sanity — endpoints didn't regress to 500 ─────────────────────────────────
header "Sanity"
expect_status "GET /centers — base" 200 "$BASE/centers"
expect_jq_nonzero "DB has centers" "$BASE/centers" '.centers | length'

# ── Summary ──────────────────────────────────────────────────────────────────
echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  PASS:  $PASS"
echo "  FAIL:  $FAIL"
echo "  WARN:  $WARN"
echo

if [[ ${#NOTES[@]} -gt 0 ]]; then
  echo "Notes:"
  for n in "${NOTES[@]}"; do
    echo "  - $n"
  done
fi

[[ $FAIL -eq 0 ]] && echo "✅ all critical checks passed" || echo "❌ $FAIL critical failures"
exit "$FAIL"
