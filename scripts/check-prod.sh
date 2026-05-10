#!/usr/bin/env bash
# Production smoke test against getactcomply.com.
# Verifies DNS, SSL cert, key public pages return 200, and SEO files exist.
# Runs without auth — what an unauthenticated visitor would experience.

set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
. "$ROOT/scripts/lib/checks.sh"
load_env

HOST="${NEXT_PUBLIC_APP_URL:-https://getactcomply.com}"
HOST="${HOST%/}"
DOMAIN=$(echo "$HOST" | sed -E 's#https?://##; s#/.*##')

header "Production — DNS + TLS"

# Try host, nslookup, getent in that order — at least one is on every
# common Linux/macOS install.
if host "$DOMAIN" >/dev/null 2>&1 \
  || nslookup "$DOMAIN" >/dev/null 2>&1 \
  || getent hosts "$DOMAIN" >/dev/null 2>&1; then
  pass "DNS resolves: $DOMAIN"
else
  fail "DNS does not resolve: $DOMAIN"
  finish
fi

# TLS cert validity — check expiry is not within 14 days
CERT_EXPIRY=$(echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:443" 2>/dev/null \
  | openssl x509 -noout -enddate 2>/dev/null | cut -d'=' -f2)
if [ -n "$CERT_EXPIRY" ]; then
  EXPIRY_EPOCH=$(date -d "$CERT_EXPIRY" +%s 2>/dev/null || echo 0)
  NOW_EPOCH=$(date +%s)
  DAYS_LEFT=$(( (EXPIRY_EPOCH - NOW_EPOCH) / 86400 ))
  if [ "$DAYS_LEFT" -gt 14 ]; then
    pass "TLS cert valid ($DAYS_LEFT days remaining)"
  elif [ "$DAYS_LEFT" -gt 0 ]; then
    warn "TLS cert expires in $DAYS_LEFT days — renew soon"
  else
    fail "TLS cert expired or invalid"
  fi
else
  warn "Could not read TLS cert expiry"
fi

header "Production — public pages return 200"

PAGES=(
  /
  /newsletter
  /partner/agreement
  /privacy
  /terms
  /eu-ai-act-compliance-checklist
  /eu-ai-act-omnibus-update
)
# Note: /pricing is an anchor on /, not its own route. Test the anchor target
# is reachable by checking the homepage contains the pricing section heading.

for p in "${PAGES[@]}"; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" -L --max-time 10 "$HOST$p")
  if [ "$CODE" = "200" ]; then
    pass "$p → 200"
  elif [ "$CODE" = "404" ]; then
    fail "$p → 404 (not deployed?)"
  else
    fail "$p → HTTP $CODE"
  fi
done

header "Production — SEO infrastructure"

for f in /robots.txt /sitemap.xml; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$HOST$f")
  if [ "$CODE" = "200" ]; then
    pass "$f → 200"
  else
    fail "$f → HTTP $CODE"
  fi
done

header "Production — auth-gated routes return correct status"

# These should redirect or 401, NOT serve content. If they 200, auth gate is broken.
for p in /dashboard /dashboard/billing /dashboard/orgs /dashboard/api-keys; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$HOST$p")
  case "$CODE" in
    307|308|302|401) pass "$p → HTTP $CODE (auth-gated correctly)" ;;
    200) fail "$p → 200 unauthenticated — auth gate broken!" ;;
    *) warn "$p → HTTP $CODE (unexpected)" ;;
  esac
done

header "Production — admin/cron endpoints reject unauthorised requests"

# These must return 401 without the right Bearer token; 200 = security hole.
# Methods differ: provision is POST, the cron digest is GET (Vercel Cron uses GET).
declare -A AUTH_GATES=(
  ["/api/admin/provision"]=POST
  ["/api/cron/alert-digest"]=GET
)
for p in "${!AUTH_GATES[@]}"; do
  m="${AUTH_GATES[$p]}"
  CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 -X "$m" "$HOST$p")
  if [ "$CODE" = "401" ]; then
    pass "$m $p → 401 (correctly rejects unauthenticated)"
  else
    fail "$m $p → HTTP $CODE without auth — should be 401"
  fi
done

finish
