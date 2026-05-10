#!/usr/bin/env bash
# Anthropic API health check.
# Sends a minimal Haiku request to verify the key works and the model is
# reachable. Costs about $0 (a few input + output tokens).

set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
. "$ROOT/scripts/lib/checks.sh"
load_env

header "Anthropic — credentials + model reachability"

require_env ANTHROPIC_API_KEY || finish
KEY="$ANTHROPIC_API_KEY"

# Use Haiku for the cheap ping. Production uses Sonnet 4.6 / Opus.
RESP=$(curl -s -w "\n%{http_code}" https://api.anthropic.com/v1/messages \
  -H "x-api-key: $KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-haiku-4-5-20251001",
    "max_tokens": 8,
    "messages": [{"role": "user", "content": "ping"}]
  }')
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')

case "$CODE" in
  200) pass "API key valid + Haiku 4.5 reachable" ;;
  401) fail "API key invalid (HTTP 401)" ;;
  403) fail "API key forbidden (HTTP 403) — check workspace permissions" ;;
  404) fail "Model not found (HTTP 404) — Haiku model id may have changed" ;;
  429) warn "Rate limited (HTTP 429) — key works but throttled" ;;
  *)   fail "Unexpected response (HTTP $CODE): $(echo "$BODY" | head -c 200)" ;;
esac

# Verify Sonnet 4.6 (the production model) is also reachable.
RESP2=$(curl -s -o /dev/null -w "%{http_code}" https://api.anthropic.com/v1/messages \
  -H "x-api-key: $KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-sonnet-4-6",
    "max_tokens": 8,
    "messages": [{"role": "user", "content": "ping"}]
  }')
case "$RESP2" in
  200) pass "Sonnet 4.6 (production model) reachable" ;;
  404) fail "Sonnet 4.6 not reachable (HTTP 404) — model id may have changed" ;;
  *)   warn "Sonnet 4.6 ping returned HTTP $RESP2" ;;
esac

finish
