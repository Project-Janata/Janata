#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

mkdir -p .ralph .context/evidence

EXCLUDE_FILE="$(git rev-parse --git-path info/exclude)"
touch "$EXCLUDE_FILE"
for pattern in ".ralph/" ".context/" "local-notes/" "evidence/" "*.mov" "*.mp4"; do
  if ! grep -qxF "$pattern" "$EXCLUDE_FILE"; then
    printf '%s\n' "$pattern" >> "$EXCLUDE_FILE"
  fi
done

if ! command -v ralph-loop >/dev/null 2>&1; then
  cat >&2 <<'EOF'
Missing `ralph-loop` on PATH.

Install it first on this Mac Mini, then rerun:
  npm run ralph:setup
EOF
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "Missing GitHub CLI (`gh`) on PATH." >&2
  exit 1
fi

gh auth status >/dev/null

node scripts/ralph/write-prd-from-github.cjs

if [ ! -f .ralph/learnings.md ]; then
  cat > .ralph/learnings.md <<'EOF'
# Ralph Learnings

Append factual execution observations below. Do not edit previous entries.
EOF
fi

cat > .ralph/verify.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

git diff --check
npm run typecheck
npm run test:frontend
npm run test:backend
npm run build
EOF
chmod +x .ralph/verify.sh

echo "Ralph local state is ready."
echo
ralph-loop status

