import { NextResponse } from 'next/server'
import { getStripe, PLANS } from '@/lib/stripe'

export async function GET() {
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
  results.app_url = {
    ok: appUrl === 'https://getactcomply.com',
    detail: appUrl || 'not set',
  }

  // 5. Countdown sanity check
  const deadline = new Date('2026-08-02T00:00:00Z')
  const days = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  results.countdown = {
    ok: days > 0,
    detail: days > 0 ? `${days} days until Aug 2 2026` : 'Deadline has passed',
  }

  const allOk = Object.values(results).every(r => r.ok)

  return NextResponse.json(
    { status: allOk ? 'healthy' : 'degraded', checks: results },
    { status: allOk ? 200 : 500 }
  )
}
