#!/usr/bin/env bash
# Vercel platform health check.
# Verifies CLI, project link, required env vars, and last production deploy.

set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
. "$ROOT/scripts/lib/checks.sh"
load_env

header "Vercel — CLI + project link"

require_cmd vercel || finish

WHOAMI=$(vercel whoami 2>&1 || true)
if echo "$WHOAMI" | grep -qE "^[a-zA-Z0-9_-]+$|^Vercel CLI"; then
  pass "Authenticated as: $(echo "$WHOAMI" | head -1)"
else
  fail "vercel whoami failed — run: vercel login"
fi

if [ -f .vercel/project.json ]; then
  PROJECT_NAME=$(grep -o '"projectName":"[^"]*"' .vercel/project.json | cut -d'"' -f4)
  pass "Project linked: $PROJECT_NAME"
else
  fail ".vercel/project.json missing — run: vercel link"
fi

header "Vercel — required env vars (production)"

# All env vars the deployed app expects in production. Checked against
# the full env list because the CLI returns each var on its own line.
REQUIRED_ENVS=(
  ANTHROPIC_API_KEY
  STRIPE_SECRET_KEY
  STRIPE_WEBHOOK_SECRET
  STRIPE_STARTER_PRICE_ID
  STRIPE_STARTER_ANNUAL_PRICE_ID
  STRIPE_BUSINESS_PRICE_ID
  STRIPE_BUSINESS_ANNUAL_PRICE_ID
  STRIPE_ENTERPRISE_PRICE_ID
  STRIPE_ENTERPRISE_ANNUAL_PRICE_ID
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  SUPABASE_SERVICE_KEY
  RESEND_API_KEY
  NEXT_PUBLIC_APP_URL
  CRON_SECRET
  ADMIN_SECRET
  ALERTS_ADMIN_SECRET
  NEWSLETTER_ADMIN_SECRET
)

ENV_LIST=$(vercel env ls production 2>/dev/null || true)
if [ -z "$ENV_LIST" ]; then
  fail "vercel env ls returned nothing — auth or project issue"
else
  for v in "${REQUIRED_ENVS[@]}"; do
    if echo "$ENV_LIST" | grep -qw "$v"; then
      pass "$v configured"
    else
      fail "$v MISSING in production env"
    fi
  done
fi

header "Vercel — latest production deployment"

# vercel ls writes the table to stderr (status-style), so redirect 2>&1
# instead of suppressing it. Find the first row tagged "Production".
LATEST_LINE=$(vercel ls 2>&1 | awk '/Production/{print; exit}' || true)
LATEST_URL=$(echo "$LATEST_LINE" | grep -oE 'https://[a-zA-Z0-9.-]+\.vercel\.app' | head -1 || true)

if [ -z "$LATEST_URL" ]; then
  warn "No production deployments found in vercel ls"
else
  if echo "$LATEST_LINE" | grep -q "● Ready"; then
    pass "Latest prod deploy READY: $LATEST_URL"
  elif echo "$LATEST_LINE" | grep -q "● Error"; then
    fail "Latest prod deploy ERRORED: $LATEST_URL"
  elif echo "$LATEST_LINE" | grep -q "● Building"; then
    warn "Latest prod deploy still BUILDING: $LATEST_URL"
  else
    warn "Latest prod deploy state unrecognised: $LATEST_LINE"
  fi
fi

finish
