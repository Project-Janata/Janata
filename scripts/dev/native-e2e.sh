#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TARGET="${1:-all}"

if ! command -v maestro >/dev/null 2>&1; then
  echo "Maestro is not installed. Install it with: curl -Ls https://get.maestro.mobile.dev | bash" >&2
  exit 1
fi

if ! java -version >/dev/null 2>&1; then
  echo "A Java runtime is required for Maestro. Install a JDK, then rerun this command." >&2
  exit 1
fi

export APP_ID="${MAESTRO_APP_ID:-org.chinmayamission.janata}"
export E2E_MEMBER_EMAIL="${E2E_MEMBER_EMAIL:-member@chinmayajanata.org}"
export E2E_MEMBER_PASSWORD="${E2E_MEMBER_PASSWORD:-PreviewTest2026!}"

cmd=(maestro)
if [[ -n "${MAESTRO_DEVICE_ID:-}" ]]; then
  cmd+=(--device "$MAESTRO_DEVICE_ID")
fi
cmd+=(test)

case "$TARGET" in
  all|ios|android)
    cmd+=("$ROOT/tests/native/maestro")
    ;;
  guest)
    cmd+=("$ROOT/tests/native/maestro/guest-smoke.yaml")
    ;;
  member)
    cmd+=("$ROOT/tests/native/maestro/member-smoke.yaml")
    ;;
  *)
    echo "Usage: npm run test:native[:ios|:android|:guest|:member]" >&2
    echo "Or: scripts/dev/native-e2e.sh [all|ios|android|guest|member]" >&2
    exit 1
    ;;
esac

"${cmd[@]}"
