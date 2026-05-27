#!/usr/bin/env bash
# scripts/db/snapshot.sh — export canon-tier tables (centers, events) to
# data/snapshots/<utc-stamp>/. Read-only against the source D1.
#
# Usage:
#   npm run db:snapshot                  # --local
#   npm run db:snapshot -- --remote      # read from production D1

set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

MODE="--local"
for arg in "$@"; do
  case "$arg" in
    --remote) MODE="" ;;
    --local)  MODE="--local" ;;
    -h|--help)
      sed -n '2,8p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *)
      echo "unknown flag: $arg" >&2
      exit 2
      ;;
  esac
done

DB_NAME="chinmaya-janata-db"
CONFIG="packages/backend/wrangler.toml"
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
OUT_DIR="data/snapshots/$STAMP"
mkdir -p "$OUT_DIR"

# Canon tier — only these tables are snapshotted. To add more, edit the array.
TABLES=( centers events )

echo "▶ Snapshotting from $([ -z "$MODE" ] && echo PRODUCTION || echo local) D1 → $OUT_DIR"
echo

for t in "${TABLES[@]}"; do
  out="$OUT_DIR/$t.sql"
  echo "  → $t"
  # `wrangler d1 export` dumps the whole DB; --table filters to one.
  npx wrangler d1 export "$DB_NAME" $MODE --table="$t" --output="$out" \
    --config "$CONFIG" >/dev/null 2>&1 \
    || { echo "✗ FAILED on $t (does the table exist?)" >&2; exit 1; }
  size=$(wc -c < "$out" | tr -d ' ')
  rows=$(grep -c '^INSERT INTO' "$out" || echo 0)
  echo "      ${size} bytes, ${rows} INSERTs"
done

# Drop a metadata file so future restores know what they have.
cat > "$OUT_DIR/.snapshot-meta.txt" <<META
snapshot: $STAMP
source:   $([ -z "$MODE" ] && echo "production (remote)" || echo "local")
tables:   ${TABLES[*]}
git:      $(git rev-parse --short HEAD) on $(git rev-parse --abbrev-ref HEAD)
META

echo
echo "✓ Snapshot complete: $OUT_DIR"
