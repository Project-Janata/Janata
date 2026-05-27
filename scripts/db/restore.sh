#!/usr/bin/env bash
# scripts/db/restore.sh — DELETE canon tables and re-INSERT from a snapshot.
#
# Usage:
#   npm run db:restore -- <snapshot-dir>                # --local
#   npm run db:restore -- --remote <snapshot-dir>       # production

set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

MODE="--local"
SNAPSHOT_DIR=""
for arg in "$@"; do
  case "$arg" in
    --remote) MODE="" ;;
    --local)  MODE="--local" ;;
    -h|--help)
      sed -n '2,7p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *)
      if [[ -z "$SNAPSHOT_DIR" ]]; then SNAPSHOT_DIR="$arg"
      else echo "unexpected arg: $arg" >&2; exit 2
      fi
      ;;
  esac
done

[[ -n "$SNAPSHOT_DIR" ]] || { echo "usage: npm run db:restore -- [--remote] <snapshot-dir>" >&2; exit 2; }
[[ -d "$SNAPSHOT_DIR" ]] || { echo "snapshot directory not found: $SNAPSHOT_DIR" >&2; exit 1; }

DB_NAME="chinmaya-janata-db"
CONFIG="packages/backend/wrangler.toml"
TABLES=( centers events )

if [[ -z "$MODE" ]]; then
  cat <<WARN
⚠  --remote: this will DELETE FROM ${TABLES[*]} on PRODUCTION D1 and
   then re-INSERT from $SNAPSHOT_DIR.

   You should only need this if a Tier 1 migration went sideways. For
   most cases, --local is what you want.
WARN
  read -r -p "Type 'restore to prod' to proceed: " CONFIRM
  if [[ "$CONFIRM" != "restore to prod" ]]; then
    echo "aborted." >&2
    exit 1
  fi
fi

echo "▶ Restoring ${TABLES[*]} from $SNAPSHOT_DIR to $([ -z "$MODE" ] && echo PRODUCTION || echo local) D1"
echo

for t in "${TABLES[@]}"; do
  snap="$SNAPSHOT_DIR/$t.sql"
  [[ -f "$snap" ]] || { echo "  ✗ snapshot file missing: $snap" >&2; exit 1; }
  echo "  → DELETE FROM $t"
  npx wrangler d1 execute "$DB_NAME" $MODE \
    --command "DELETE FROM $t;" --config "$CONFIG" >/dev/null 2>&1 \
    || { echo "  ✗ delete failed on $t" >&2; exit 1; }
  echo "  → restoring from $(basename "$snap") ($(grep -c '^INSERT INTO' "$snap" || echo 0) INSERTs)"
  npx wrangler d1 execute "$DB_NAME" $MODE \
    --file="$snap" --config "$CONFIG" >/dev/null 2>&1 \
    || { echo "  ✗ restore failed on $t" >&2; exit 1; }
done

echo
echo "✓ Restore complete from $SNAPSHOT_DIR"
