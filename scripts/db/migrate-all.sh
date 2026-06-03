#!/usr/bin/env bash
# scripts/db/migrate-all.sh — apply every migrations/00NN_*.sql in order.
#
# Default mode: --local (touches your local D1 only).
# Explicit --remote: applies to the production chinmaya-janata-db.
#
# Exits on first failing migration so you can fix and re-run.
#
# Usage:
#   npm run d1:migrate:all                  # --local
#   npm run d1:migrate:all -- --remote      # production (be deliberate)

set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

MODE="--local"
RESET=0
for arg in "$@"; do
  case "$arg" in
    --remote) MODE="" ;;
    --local)  MODE="--local" ;;
    --reset)  RESET=1 ;;
    -h|--help)
      sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'
      cat <<'MORE'
  npm run d1:migrate:all -- --reset       # nuke local D1 first, then apply
                                          # (--reset is local-only by design)
MORE
      exit 0
      ;;
    *)
      echo "unknown flag: $arg" >&2
      exit 2
      ;;
  esac
done

if [[ "$RESET" -eq 1 && -z "$MODE" ]]; then
  echo "✗ --reset cannot be combined with --remote (refuses to nuke prod)" >&2
  exit 2
fi

if [[ "$RESET" -eq 1 ]]; then
  LOCAL_STATE="packages/backend/.wrangler/state"
  echo "▶ --reset: removing $LOCAL_STATE"
  rm -rf "$LOCAL_STATE"
fi

if [[ -z "$MODE" ]]; then
  cat <<'WARN'
⚠  --remote: this will apply migrations against the PRODUCTION D1
   (chinmaya-janata-db, shared with staging worker).

   Prerequisites:
     - You have already run this same set of migrations against --local
       and confirmed `npm run test:backend` passes.
     - For Tier 1 canon-table changes, you have a snapshot:
         npm run db:snapshot -- --remote
WARN
  read -r -p "Type 'apply to prod' to proceed: " CONFIRM
  if [[ "$CONFIRM" != "apply to prod" ]]; then
    echo "aborted." >&2
    exit 1
  fi
fi

DB_NAME="chinmaya-janata-db"
CONFIG="packages/backend/wrangler.toml"

FILES=( migrations/0[0-9][0-9][0-9]_*.sql )
if [[ ${#FILES[@]} -eq 0 || ! -f "${FILES[0]}" ]]; then
  echo "no migrations matching migrations/00NN_*.sql" >&2
  exit 1
fi

echo "▶ Applying ${#FILES[@]} migrations against $([ -z "$MODE" ] && echo PRODUCTION || echo local) D1"
echo

for f in "${FILES[@]}"; do
  echo "  → $(basename "$f")"
  # Capture stderr so a failure shows WHY (e.g. a FOREIGN KEY violation) instead
  # of a silent "FAILED on X" — that opacity is what made the 0010 ordering bug
  # hard to spot (see #331).
  if ! err=$(npx wrangler d1 execute "$DB_NAME" $MODE --file="$f" --config "$CONFIG" 2>&1 >/dev/null); then
    echo "✗ FAILED on $(basename "$f")" >&2
    echo "$err" | grep -iE 'error|constraint|sqlite|no such' | tail -6 >&2
    exit 1
  fi
done

echo
echo "✓ ${#FILES[@]} migrations applied."
