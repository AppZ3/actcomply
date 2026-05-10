#!/usr/bin/env bash
# Run every check-*.sh script in sequence and report aggregate health.
# Each child script exits non-zero on any FAIL; this orchestrator collects.

set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"

CHECKS=(
  check-vercel.sh
  check-supabase.sh
  check-stripe.sh
  check-resend.sh
  check-anthropic.sh
  check-prod.sh
)

TOTAL_FAIL=0
RESULTS=()

for c in "${CHECKS[@]}"; do
  echo
  echo "════════════════════════════════════════════════"
  echo "  Running scripts/$c"
  echo "════════════════════════════════════════════════"
  if bash "scripts/$c"; then
    RESULTS+=("✓ $c")
  else
    RESULTS+=("✗ $c")
    TOTAL_FAIL=$((TOTAL_FAIL+1))
  fi
done

echo
echo "════════════════════════════════════════════════"
echo "  System Check Summary"
echo "════════════════════════════════════════════════"
for r in "${RESULTS[@]}"; do
  echo "  $r"
done
echo
if [ "$TOTAL_FAIL" -eq 0 ]; then
  echo "  All systems green ✓"
  exit 0
else
  echo "  $TOTAL_FAIL check script(s) failed — review output above"
  exit 1
fi
