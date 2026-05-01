#!/usr/bin/env bash
# ActComply — comprehensive codebase verifier
# Run from project root: bash scripts/verify.sh

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PASS=0; FAIL=0; WARN=0

green()  { echo -e "\033[32m  ✓ $1\033[0m"; }
red()    { echo -e "\033[31m  ✗ $1\033[0m"; }
yellow() { echo -e "\033[33m  ⚠ $1\033[0m"; }
header() { echo -e "\n\033[1;34m── $1 ──\033[0m"; }

pass() { green "$1";  PASS=$((PASS+1)); }
fail() { red   "$1";  FAIL=$((FAIL+1)); }
warn() { yellow "$1"; WARN=$((WARN+1)); }

# ── 1. TypeScript ──────────────────────────────────────────────────────────────
header "TypeScript"
TSC_OUT=$(npx tsc --noEmit 2>&1 || true)
TS_ERRORS=$(echo "$TSC_OUT" | grep -c "error TS" || true)
if [ "$TS_ERRORS" -gt 0 ]; then
  fail "$TS_ERRORS TypeScript error(s):"
  echo "$TSC_OUT" | grep "error TS" | head -15
else
  pass "No TypeScript errors"
fi

# ── 2. Null-safety — unguarded array methods ──────────────────────────────────
header "Null-safety"

# Look for .map( on a bare identifier (not after ?. or ?? [])
UNSAFE=$(grep -rn --include="*.tsx" \
  -E '[a-zA-Z_]\.(map|filter|forEach|find|some|every)\(' \
  app/ components/ 2>/dev/null | \
  grep -v '\?\.' | grep -v '?? \[\]' | grep -v '^\s*//' | \
  grep -v 'node_modules' || true)
UNSAFE_COUNT=$(echo "$UNSAFE" | grep -c . || true)
if [ "$UNSAFE_COUNT" -gt 0 ]; then
  warn "$UNSAFE_COUNT potentially unguarded array calls — top 10:"
  echo "$UNSAFE" | head -10 | sed 's/^/    /'
else
  pass "No obviously unguarded array method calls"
fi

# Unguarded .length (basic check)
LEN_UNSAFE=$(grep -rn --include="*.tsx" -E '[a-zA-Z_$]\.(length)' \
  app/ components/ 2>/dev/null | \
  grep -v '\?\.' | grep -v '^\s*//' | grep -v 'node_modules' | wc -l || true)
if [ "$LEN_UNSAFE" -gt 20 ]; then
  warn "$LEN_UNSAFE .length accesses without ?. guard (review if new crashes appear)"
else
  pass ".length usage looks acceptable ($LEN_UNSAFE occurrences)"
fi

# ── 3. API routes ─────────────────────────────────────────────────────────────
header "API routes"

ROUTES=$(find app/api -name "route.ts" 2>/dev/null | sort)
ROUTE_COUNT=$(echo "$ROUTES" | grep -c . || true)
pass "$ROUTE_COUNT API routes found"

NO_TRY=0
for f in $ROUTES; do
  if grep -q "async function POST\|async function PUT\|async function PATCH\|async function DELETE" "$f" 2>/dev/null; then
    if ! grep -q "try {" "$f" 2>/dev/null; then
      warn "No try/catch in mutating route: $f"
      NO_TRY=$((NO_TRY+1))
    fi
  fi
done
if [ "$NO_TRY" -eq 0 ]; then
  pass "All mutating routes have try/catch"
fi

NO_AUTH=0
for f in $ROUTES; do
  if ! grep -q "getUser\|Unauthorized\|auth\." "$f" 2>/dev/null; then
    warn "Route may lack auth check: $f"
    NO_AUTH=$((NO_AUTH+1))
  fi
done
if [ "$NO_AUTH" -eq 0 ]; then
  pass "All routes appear to check auth"
fi

# ── 4. Environment variables ───────────────────────────────────────────────────
header "Environment variables"
REQUIRED_VARS=(
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  SUPABASE_SERVICE_ROLE_KEY
  ANTHROPIC_API_KEY
  STRIPE_SECRET_KEY
  STRIPE_WEBHOOK_SECRET
  STRIPE_STARTER_PRICE_ID
  STRIPE_BUSINESS_PRICE_ID
  STRIPE_ENTERPRISE_PRICE_ID
  RESEND_API_KEY
)
ENV_FILE=".env.local"
if [ ! -f "$ENV_FILE" ]; then
  warn ".env.local not found — skipping local env var check"
else
  MISSING=0
  for var in "${REQUIRED_VARS[@]}"; do
    if ! grep -q "^${var}=" "$ENV_FILE" 2>/dev/null; then
      fail "$var missing from .env.local"
      MISSING=$((MISSING+1))
    fi
  done
  if [ "$MISSING" -eq 0 ]; then
    pass "All ${#REQUIRED_VARS[@]} required env vars present in .env.local"
  fi
fi

# ── 5. Database patterns ──────────────────────────────────────────────────────
header "Database patterns"

# Upsert without onConflict — check 10 lines of context around each call
UPSERT_FILES=$(grep -rln --include="*.ts" "\.upsert(" app/ 2>/dev/null || true)
BAD_UPSERT=0
for f in $UPSERT_FILES; do
  # Get line numbers of upsert calls
  while IFS= read -r lineno; do
    # Check 10 lines from the upsert for onConflict
    if ! sed -n "${lineno},$((lineno+10))p" "$f" 2>/dev/null | grep -q "onConflict"; then
      warn "upsert without onConflict at $f:$lineno"
      BAD_UPSERT=$((BAD_UPSERT+1))
    fi
  done < <(grep -n "\.upsert(" "$f" 2>/dev/null | cut -d: -f1)
done
if [ "$BAD_UPSERT" -eq 0 ]; then
  pass "All upsert calls specify onConflict"
fi

# Admin client used in client components (security check)
ADMIN_IN_CLIENT=$(grep -rln "getSupabaseAdmin" app/ components/ 2>/dev/null | \
  xargs grep -l "'use client'" 2>/dev/null || true)
if [ -n "$ADMIN_IN_CLIENT" ]; then
  fail "Admin Supabase client used in client component (security risk):"
  echo "$ADMIN_IN_CLIENT" | sed 's/^/    /'
else
  pass "Admin Supabase client not exposed to client components"
fi

# ── 6. Client component patterns ─────────────────────────────────────────────
header "Client components"

# useEffect with fetch but no error handler
FETCH_NO_CATCH=$(grep -rln "fetch(" app/ components/ --include="*.tsx" 2>/dev/null | \
  xargs grep -l "'use client'" 2>/dev/null | \
  xargs grep -L "catch\|setGenError\|setError" 2>/dev/null || true)
if [ -n "$FETCH_NO_CATCH" ]; then
  warn "Client components with fetch but no error handler:"
  echo "$FETCH_NO_CATCH" | head -5 | sed 's/^/    /'
else
  pass "Client fetch calls all have error handling"
fi

# ── 7. Test suite ─────────────────────────────────────────────────────────────
header "Test suite"
TEST_OUT=$(npx vitest run --reporter=verbose 2>&1 || true)
FAILED_TESTS=$(echo "$TEST_OUT" | grep -c "FAIL\|✗\| × " || true)
PASSED_TESTS=$(echo "$TEST_OUT" | grep -c "✓\| ✓ \|PASS" || true)
if [ "$FAILED_TESTS" -gt 0 ]; then
  fail "$FAILED_TESTS test(s) failed"
  echo "$TEST_OUT" | grep -A2 "FAIL\| × " | head -20 | sed 's/^/    /'
else
  pass "$PASSED_TESTS test checks passed"
fi

# ── 8. Duplicate/stale code patterns ─────────────────────────────────────────
header "Code hygiene"

# console.log left in production code
CONSOLELOGS=$(grep -rn "console\.log(" app/ components/ lib/ \
  --include="*.ts" --include="*.tsx" 2>/dev/null | \
  grep -v "^\s*//" | grep -v "node_modules" | wc -l || true)
if [ "$CONSOLELOGS" -gt 0 ]; then
  warn "$CONSOLELOGS console.log statement(s) in production code"
else
  pass "No console.log in production code"
fi

# TODO comments
TODOS=$(grep -rn "TODO\|FIXME\|HACK\|XXX" app/ lib/ components/ \
  --include="*.ts" --include="*.tsx" 2>/dev/null | \
  grep -v "node_modules\|^\s*//" | wc -l || true)
if [ "$TODOS" -gt 0 ]; then
  warn "$TODOS TODO/FIXME comments in codebase"
fi

# ── Summary ────────────────────────────────────────────────────────────────────
echo ""
echo "────────────────────────────────────────"
echo -e "  \033[32m✓ Passed: $PASS\033[0m   \033[33m⚠ Warnings: $WARN\033[0m   \033[31m✗ Failed: $FAIL\033[0m"
echo "────────────────────────────────────────"

if [ "$FAIL" -gt 0 ]; then
  echo "  Fix failures before deploying."
  exit 1
fi
echo "  Good to deploy. Review warnings before shipping."
exit 0
