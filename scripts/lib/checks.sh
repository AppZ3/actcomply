#!/usr/bin/env bash
# Shared helpers for scripts/check-*.sh
# Source this from each check script: . "$(dirname "$0")/lib/checks.sh"

# Aggregate counters — each script keeps its own; check-all.sh reads them.
PASS=${PASS:-0}; FAIL=${FAIL:-0}; WARN=${WARN:-0}

green()  { echo -e "\033[32m  ✓ $1\033[0m"; }
red()    { echo -e "\033[31m  ✗ $1\033[0m"; }
yellow() { echo -e "\033[33m  ⚠ $1\033[0m"; }
header() { echo -e "\n\033[1;34m── $1 ──\033[0m"; }

pass() { green  "$1"; PASS=$((PASS+1)); }
fail() { red    "$1"; FAIL=$((FAIL+1)); }
warn() { yellow "$1"; WARN=$((WARN+1)); }

# Load .env.local from the project root if present. Vars become available
# to the check scripts. Safe to call even if file is missing.
load_env() {
  local root env_file
  root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
  env_file="$root/.env.local"
  if [ -f "$env_file" ]; then
    # shellcheck disable=SC1090,SC2046
    set -a; . "$env_file"; set +a
  fi
}

# Print summary block. Exits non-zero if any FAIL.
finish() {
  echo
  echo "── Summary ─────────────────────────────────────"
  echo "  Passed:   $PASS"
  echo "  Warnings: $WARN"
  echo "  Failed:   $FAIL"
  echo "────────────────────────────────────────────────"
  [ "$FAIL" -gt 0 ] && exit 1 || exit 0
}

# Require an env var to be set; fails the check if missing or empty.
require_env() {
  local var=$1
  if [ -z "${!var:-}" ]; then
    fail "$var not set in environment"
    return 1
  fi
  return 0
}

# Require a CLI to be on PATH. Returns 1 if missing.
require_cmd() {
  local cmd=$1
  if ! command -v "$cmd" >/dev/null 2>&1; then
    fail "$cmd not installed (need it on PATH)"
    return 1
  fi
  return 0
}
