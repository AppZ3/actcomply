#!/usr/bin/env bash
# Stripe health check.
# Verifies key auth, products + prices configured, webhook endpoint set.

set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
. "$ROOT/scripts/lib/checks.sh"
load_env

header "Stripe — credentials"

require_env STRIPE_SECRET_KEY || finish
KEY="$STRIPE_SECRET_KEY"

CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  https://api.stripe.com/v1/balance -u "$KEY:")
if [ "$CODE" = "200" ]; then
  pass "API key valid"
else
  fail "API key auth failed (HTTP $CODE)"
  finish
fi

# Live vs test mode — surfaces accidental test keys in prod env
if echo "$KEY" | grep -q "^sk_live_"; then
  pass "Using LIVE mode key"
elif echo "$KEY" | grep -q "^sk_test_"; then
  warn "Using TEST mode key (production should use sk_live_)"
fi

header "Stripe — products configured"

REQUIRED_PRICE_IDS=(
  STRIPE_STARTER_PRICE_ID
  STRIPE_STARTER_ANNUAL_PRICE_ID
  STRIPE_BUSINESS_PRICE_ID
  STRIPE_BUSINESS_ANNUAL_PRICE_ID
  STRIPE_ENTERPRISE_PRICE_ID
  STRIPE_ENTERPRISE_ANNUAL_PRICE_ID
)

for var in "${REQUIRED_PRICE_IDS[@]}"; do
  pid="${!var:-}"
  if [ -z "$pid" ]; then
    fail "$var not set"
    continue
  fi
  CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    "https://api.stripe.com/v1/prices/$pid" -u "$KEY:")
  if [ "$CODE" = "200" ]; then
    pass "$var → $pid resolves"
  else
    fail "$var → $pid not found in Stripe (HTTP $CODE)"
  fi
done

header "Stripe — webhook endpoints"

WEBHOOKS=$(curl -s "https://api.stripe.com/v1/webhook_endpoints" -u "$KEY:")
HOST="${NEXT_PUBLIC_APP_URL:-https://getactcomply.com}"
HOST="${HOST%/}"
if echo "$WEBHOOKS" | grep -q "$HOST/api/webhooks/stripe"; then
  pass "Webhook endpoint registered: $HOST/api/webhooks/stripe"
else
  fail "No webhook endpoint registered for $HOST/api/webhooks/stripe"
fi

# Required event types (subset — webhook handler in app/api/webhooks/stripe expects these)
for evt in customer.subscription.created customer.subscription.updated customer.subscription.deleted invoice.payment_failed; do
  if echo "$WEBHOOKS" | grep -q "\"$evt\""; then
    pass "Listening for $evt"
  else
    warn "Not subscribed to $evt — webhook may miss this event"
  fi
done

finish
