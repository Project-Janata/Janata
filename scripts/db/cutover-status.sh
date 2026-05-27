#!/usr/bin/env bash
# scripts/db/cutover-status.sh — show what would happen if we merged v2 → main
# right now. Identifies pending migrations, classifies them by tier (canon vs
# disposable), and prints the exact apply commands in order.
#
# Run via the npm wrapper for the usual case:
#   npm run db:cutover-status                  # human-readable
#   npm run db:cutover-status -- --machine     # just the migration file list
#   npm run db:cutover-status -- --post-slack  # post a release summary to
#                                              # #product-updates (run AFTER cutover)
#
# See docs/release-cutover.md for the full release runbook.

set -uo pipefail
export LC_ALL="${LC_ALL:-en_US.UTF-8}"
export LANG="${LANG:-en_US.UTF-8}"

cd "$(git rev-parse --show-toplevel)"

MODE="human"
for arg in "$@"; do
  case "$arg" in
    --machine) MODE="machine" ;;
    --post-slack) MODE="slack" ;;
    -h|--help)
      sed -n '2,11p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *) echo "unknown flag: $arg" >&2; exit 2 ;;
  esac
done

# Make sure we have fresh refs (don't fetch silently in machine mode — keep
# behavior predictable for scripts)
if [[ "$MODE" == "human" ]]; then
  git fetch origin main v2 --quiet 2>/dev/null || true
fi

# Use origin/main and origin/v2 to compare what's been pushed, not the local
# state.
MAIN_REF="origin/main"
V2_REF="origin/v2"
git rev-parse "$MAIN_REF" >/dev/null 2>&1 || MAIN_REF="main"
git rev-parse "$V2_REF"   >/dev/null 2>&1 || V2_REF="v2"

# Migrations on v2 that aren't on main yet — by file existence diff, not
# commit set. Robust to squash-merges that change commit SHAs.
# Use comm(1) instead of bash associative arrays (this runs on macOS bash 3.2).
TMPMAIN=$(mktemp -t ralph-cutover-main.XXXXXX)
TMPV2=$(mktemp -t ralph-cutover-v2.XXXXXX)
TMPPEND=$(mktemp -t ralph-cutover-pending.XXXXXX)
trap 'rm -f "$TMPMAIN" "$TMPV2" "$TMPPEND"' EXIT

git ls-tree -r --name-only "$MAIN_REF" -- migrations/ 2>/dev/null \
  | grep -E '^migrations/0[0-9]+_.+\.sql$' | sort > "$TMPMAIN" || true
git ls-tree -r --name-only "$V2_REF" -- migrations/ 2>/dev/null \
  | grep -E '^migrations/0[0-9]+_.+\.sql$' | sort > "$TMPV2" || true

# comm -23: lines only in V2_FILES (already sorted)
comm -23 "$TMPV2" "$TMPMAIN" > "$TMPPEND"

# Read pending into an array (portable to bash 3.2)
PENDING=()
while IFS= read -r line; do
  [[ -n "$line" ]] && PENDING+=("$line")
done < "$TMPPEND"

# Detect canon-tier touches (any migration that references centers or events)
is_canon() {
  local f="$1"
  grep -qE '\b(centers|events)\b' "$f" 2>/dev/null
}

# Machine mode: just the file list, one per line (used by docs/release-cutover.md)
if [[ "$MODE" == "machine" ]]; then
  printf '%s\n' "${PENDING[@]}"
  exit 0
fi

# Slack mode: post a one-shot release summary
if [[ "$MODE" == "slack" ]]; then
  TOKEN="${JANATA_SLACK_BOT_TOKEN:-}"
  [[ -z "$TOKEN" && -f .ralph/.slack-bot-token ]] && TOKEN=$(cat .ralph/.slack-bot-token)
  [[ -n "$TOKEN" ]] || { echo "❌ no Slack bot token" >&2; exit 1; }
  AHEAD=$(git rev-list --count "$MAIN_REF..$V2_REF" 2>/dev/null || echo "?")
  TEXT=$(printf 'release: v2 → main applied. %d commits ahead, %d migrations applied:\n%s' \
    "$AHEAD" "${#PENDING[@]}" "$(printf '  - %s\n' "${PENDING[@]}")")
  PAYLOAD=$(jq -nc --arg ch "#product-updates" --arg t "$TEXT" '{channel:$ch, text:$t}')
  RESP=$(curl -sS -X POST https://slack.com/api/chat.postMessage \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json; charset=utf-8" \
    --data "$PAYLOAD")
  if [[ "$(printf '%s' "$RESP" | jq -r '.ok')" == "true" ]]; then
    echo "✓ posted to #product-updates"
  else
    echo "❌ slack post failed:"; printf '%s' "$RESP" | jq . >&2 2>/dev/null
    exit 1
  fi
  exit 0
fi

# ─── Human-readable mode (default) ───────────────────────────────────────────
AHEAD=$(git rev-list --count "$MAIN_REF..$V2_REF" 2>/dev/null || echo "?")
BEHIND=$(git rev-list --count "$V2_REF..$MAIN_REF" 2>/dev/null || echo "0")
MAIN_HEAD=$(git log -1 --pretty='%h %s' "$MAIN_REF" 2>/dev/null)
V2_HEAD=$(git log -1   --pretty='%h %s' "$V2_REF"   2>/dev/null)

echo "━━━ Cutover status: v2 → main ━━━"
echo "  main HEAD: $MAIN_HEAD"
echo "  v2 HEAD:   $V2_HEAD"
echo "  v2 is $AHEAD commits ahead of main"
[[ "$BEHIND" -gt 0 ]] && echo "  ⚠ v2 is also $BEHIND commits BEHIND main — rebase before cutover"
echo

if (( ${#PENDING[@]} == 0 )); then
  echo "━━━ Pending migrations: none ━━━"
  echo "  Nothing to apply. If v2 is ahead by code-only changes, you can"
  echo "  skip steps 2–3 of docs/release-cutover.md and go straight to the"
  echo "  PR open + merge."
  exit 0
fi

ANY_CANON=0
echo "━━━ Pending migrations (${#PENDING[@]}) ━━━"
for f in "${PENDING[@]}"; do
  if is_canon "$f"; then
    echo "  ⚠ $f  (Tier 1 — references centers or events; snapshot recommended)"
    ANY_CANON=1
  else
    echo "    $f  (Tier 2)"
  fi
done

# Try to map each migration to its introducing PR (best-effort)
echo
echo "━━━ Introducing PRs ━━━"
for f in "${PENDING[@]}"; do
  COMMIT=$(git log "$V2_REF" --diff-filter=A --format=%H -- "$f" 2>/dev/null | tail -1)
  if [[ -n "$COMMIT" ]]; then
    SUBJECT=$(git log -1 --pretty=%s "$COMMIT" 2>/dev/null)
    PR=$(echo "$SUBJECT" | grep -oE '#[0-9]+' | head -1)
    printf '    %-44s %s %s\n' "$(basename "$f")" "${PR:-(no #ref in commit msg)}" "(${COMMIT:0:7})"
  fi
done

echo
echo "━━━ Apply order (run from repo root) ━━━"
if (( ANY_CANON )); then
  echo "  npm run db:snapshot -- --remote      # canon-tier change in this set"
fi
for f in "${PENDING[@]}"; do
  echo "  npx wrangler d1 execute chinmaya-janata-db --file=$f --config packages/backend/wrangler.toml"
done

echo
echo "━━━ Then ━━━"
echo "  gh pr create --base main --head v2 --repo Project-Janata/Janata \\"
echo "    --title \"release: v2 → main (\$(date -u +%Y-%m-%d))\""
echo "  gh pr merge <PR-num> --squash --repo Project-Janata/Janata"
echo "  # wait + verify staging, then:"
echo "  gh workflow run Deploy -f environment=production --repo Project-Janata/Janata"
echo
echo "Full runbook: docs/release-cutover.md"
