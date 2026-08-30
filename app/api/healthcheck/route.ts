import { NextRequest, NextResponse } from 'next/server'
import { getStripe, PLANS } from '@/lib/stripe'
import { bearerOk } from '@/lib/auth-bearer'
import { getEnforcementStatus } from '@/lib/eu-ai-act'

export async function GET(req: NextRequest) {
  // Bearer-gated detail. Unauthenticated callers get a one-bit status so
  // uptime probes still work, but the full env-var inventory + raw error
  // strings are only returned to a caller holding CRON_SECRET.
  const detailed = bearerOk(req.headers.get('authorization'), process.env.CRON_SECRET)

  const results: Record<string, { ok: boolean; detail: string }> = {}

  // 1. Environment variables
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'STRIPE_STARTER_PRICE_ID',
    'STRIPE_STARTER_ANNUAL_PRICE_ID',
    'STRIPE_BUSINESS_PRICE_ID',
    'STRIPE_BUSINESS_ANNUAL_PRICE_ID',
    'STRIPE_ENTERPRISE_PRICE_ID',
    'STRIPE_ENTERPRISE_ANNUAL_PRICE_ID',
    'ANTHROPIC_API_KEY',
    'NEXT_PUBLIC_APP_URL',
    'RESEND_API_KEY',
    'ALERTS_ADMIN_SECRET',
  ]
  const missingEnvVars = requiredEnvVars.filter(k => !process.env[k])
  results.env_vars = {
    ok: missingEnvVars.length === 0,
    detail: missingEnvVars.length === 0
      ? `All ${requiredEnvVars.length} required env vars present (${requiredEnvVars.length})`
      : `Missing: ${missingEnvVars.join(', ')}`,
  }

  // 2. Supabase connection
  try {
    const { supabaseAdmin } = await import('@/lib/supabase-admin')
    const { error } = await supabaseAdmin.from('profiles').select('id').limit(1)
    results.supabase = {
      ok: !error,
      detail: error ? error.message : 'Connected and profiles table accessible',
    }
  } catch (e) {
    results.supabase = { ok: false, detail: String(e) }
  }

  // 3. Stripe price IDs valid
  try {
    const stripe = getStripe()
    const priceChecks = await Promise.all(
      Object.entries(PLANS).flatMap(([key, plan]) => [
        stripe.prices.retrieve(plan.priceId).then(() => ({ key: `${key}_monthly`, ok: true, detail: 'valid' })).catch(e => ({ key: `${key}_monthly`, ok: false, detail: e.message })),
        stripe.prices.retrieve(plan.annualPriceId).then(() => ({ key: `${key}_annual`, ok: true, detail: 'valid' })).catch(e => ({ key: `${key}_annual`, ok: false, detail: e.message })),
      ])
    )
    const failed = priceChecks.filter(p => !p.ok)
    results.stripe_prices = {
      ok: failed.length === 0,
      detail: failed.length === 0
        ? `All 6 price IDs valid`
        : `Invalid: ${failed.map(p => `${p.key} (${p.detail})`).join(', ')}`,
    }
  } catch (e) {
    results.stripe_prices = { ok: false, detail: String(e) }
  }

  // 4. App URL config
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  const validUrls = ['https://getactcomply.com', 'https://www.getactcomply.com']
  results.app_url = {
    ok: validUrls.includes(appUrl),
    detail: appUrl || 'not set',
  }

  // 5. Enforcement timeline sanity check.
  // A date going past is not a fault, the Act phases in over several years. This
  // fails only when every tracked milestone is behind us, which means the site has
  // nothing left to count towards and the timeline copy needs a human.
  const enforcement = getEnforcementStatus()
  results.countdown = {
    ok: enforcement.next !== null,
    detail: enforcement.next
      ? `${enforcement.enforcementLive ? 'Enforcement live' : 'Pre-enforcement'}, ${enforcement.daysUntilNext} days until ${enforcement.next.displayDate} (${enforcement.next.key})`
      : 'All tracked milestones have passed, enforcement timeline copy needs review',
  }

  const allOk = Object.values(results).every(r => r.ok)
  const status = allOk ? 200 : 500

  if (!detailed) {
    return NextResponse.json(
      { status: allOk ? 'healthy' : 'degraded' },
      { status }
    )
  }

  return NextResponse.json(
    { status: allOk ? 'healthy' : 'degraded', checks: results },
    { status }
  )
}
