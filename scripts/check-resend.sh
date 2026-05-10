#!/usr/bin/env bash
# Resend health check.
# Verifies API key and that getactcomply.com sender domains are verified.

set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
. "$ROOT/scripts/lib/checks.sh"
load_env

header "Resend — credentials"

require_env RESEND_API_KEY || finish
KEY="$RESEND_API_KEY"

DOMAINS=$(curl -s -w "\n%{http_code}" https://api.resend.com/domains \
  -H "Authorization: Bearer $KEY")
CODE=$(echo "$DOMAINS" | tail -1)
BODY=$(echo "$DOMAINS" | sed '$d')

if [ "$CODE" != "200" ]; then
  fail "API key auth failed (HTTP $CODE) — body: $(echo "$BODY" | head -c 200)"
  finish
fi
pass "API key valid"

header "Resend — verified domains"

# Listing returns JSON with data[].name and data[].status.
# We need getactcomply.com verified for the marketing/alerts senders to work.
if echo "$BODY" | grep -q '"name":"getactcomply.com"'; then
  if echo "$BODY" | grep -A2 '"name":"getactcomply.com"' | grep -q '"status":"verified"'; then
    pass "getactcomply.com verified"
  else
    fail "getactcomply.com listed but NOT verified — check Resend dashboard"
  fi
else
  fail "getactcomply.com not listed — outbound email will fail"
fi

# The newsletter sender is a separate concern — flag it as a warning
# since it's not strictly required for the platform to function.
if echo "$BODY" | grep -A2 '"name":"getactcomply.com"' | grep -q '"status":"verified"'; then
  pass "newsletter@getactcomply.com sendable (covered by domain verification)"
fi

finish
