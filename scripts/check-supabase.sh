#!/usr/bin/env bash
# Supabase health check.
# Verifies URL/key, required tables, multi-entity migration applied, and
# the has_org_access RLS helper function exists. Uses PostgREST so it works
# without the Supabase CLI.

set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
. "$ROOT/scripts/lib/checks.sh"
load_env

header "Supabase — credentials + reachability"

require_env NEXT_PUBLIC_SUPABASE_URL || finish
require_env SUPABASE_SERVICE_KEY     || finish

URL="${NEXT_PUBLIC_SUPABASE_URL%/}"
KEY="$SUPABASE_SERVICE_KEY"

PING=$(curl -s -o /dev/null -w "%{http_code}" "$URL/rest/v1/" \
  -H "apikey: $KEY" -H "Authorization: Bearer $KEY")
if [ "$PING" = "200" ]; then
  pass "REST API reachable + auth OK ($URL)"
else
  fail "REST API returned HTTP $PING — bad URL or service key?"
  finish
fi

# Quick region heuristic — surfaces accidental cross-region drift.
HOST=$(echo "$URL" | sed -E 's#https?://##; s#/.*##')
if echo "$HOST" | grep -qE '^[a-z]+\.supabase\.co$'; then
  REGION_HINT=$(echo "$HOST" | cut -d'.' -f1 | head -c 6)
  pass "Project host: $HOST (id starts: $REGION_HINT — confirm matches expected region in Supabase dashboard)"
fi

header "Supabase — required tables exist"

REQUIRED_TABLES=(
  profiles assessments requirement_progress technical_docs logging_specs
  gdpr_assessments risk_management_plans regulatory_alerts alert_reads
  audit_log conformity_share_tokens incidents api_keys
  organizations org_members
  newsletter_subscribers newsletter_issues newsletter_sends
)

for t in "${REQUIRED_TABLES[@]}"; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" -X HEAD \
    "$URL/rest/v1/$t?select=*&limit=0" \
    -H "apikey: $KEY" -H "Authorization: Bearer $KEY")
  if [ "$CODE" = "200" ] || [ "$CODE" = "206" ]; then
    pass "$t exists"
  else
    fail "$t missing or inaccessible (HTTP $CODE)"
  fi
done

header "Supabase — multi-entity partitioning (org_id columns)"

ORG_PARTITIONED=(
  assessments technical_docs requirement_progress audit_log
  risk_management_plans logging_specs gdpr_assessments incidents
  conformity_share_tokens
)

for t in "${ORG_PARTITIONED[@]}"; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    "$URL/rest/v1/$t?select=org_id&limit=0" \
    -H "apikey: $KEY" -H "Authorization: Bearer $KEY")
  if [ "$CODE" = "200" ] || [ "$CODE" = "206" ]; then
    pass "$t.org_id present"
  else
    fail "$t.org_id missing (HTTP $CODE) — re-run add_org_partitioning.sql"
  fi
done

header "Supabase — has_org_access() RLS helper"

# Function call via PostgREST RPC. has_org_access(uuid) returns bool;
# called with a random UUID will return false (function exists, no access).
RESP=$(curl -s -X POST "$URL/rest/v1/rpc/has_org_access" \
  -H "apikey: $KEY" -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -d '{"target_org_id":"00000000-0000-0000-0000-000000000000"}')
if [ "$RESP" = "false" ] || [ "$RESP" = "true" ]; then
  pass "has_org_access(uuid) callable (returned: $RESP)"
else
  fail "has_org_access(uuid) call failed — response: $RESP"
fi

finish
