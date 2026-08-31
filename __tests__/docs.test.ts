import { describe, it, expect } from 'vitest'

const BASE_URL = process.env.TEST_BASE_URL || 'https://getactcomply.com'

// Docs routes require authentication — these tests verify the auth guards
// and the shape of the upgrade_required response without needing a real session.

describe('GET /api/docs/:assessmentId', () => {
  it('returns 401 for unauthenticated requests', async () => {
    const res = await fetch(`${BASE_URL}/api/docs/non-existent-id`)
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.error).toBe('Unauthorized')
  }, 10_000)
})

describe('POST /api/docs/:assessmentId', () => {
  it('returns 401 for unauthenticated requests', async () => {
    const res = await fetch(`${BASE_URL}/api/docs/non-existent-id`, {
      method: 'POST',
    })
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.error).toBe('Unauthorized')
  }, 10_000)
})

describe('GET /api/healthcheck', () => {
  it('returns healthy status to anonymous callers, without the check detail', async () => {
    const res = await fetch(`${BASE_URL}/api/healthcheck`)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.status).toBe('healthy')
    // The route bearer-gates the detail so uptime probes get a one-bit status
    // while the env-var inventory and raw error strings stay private. This
    // assertion is the guard on that, so an anonymous caller seeing `checks`
    // is a leak, not a convenience.
    expect(data.checks).toBeUndefined()
  }, 15_000)

  // Runs only where the secret is available, e.g. CI with TEST_CRON_SECRET set.
  const cronSecret = process.env.TEST_CRON_SECRET
  it.skipIf(!cronSecret)('returns the full check detail to a bearer-authorised caller', async () => {
    const res = await fetch(`${BASE_URL}/api/healthcheck`, {
      headers: { authorization: `Bearer ${cronSecret}` },
    })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.status).toBe('healthy')
    expect(data.checks).toBeDefined()
    expect(data.checks.supabase?.ok).toBe(true)
    expect(data.checks.stripe_prices?.ok).toBe(true)
    expect(data.checks.env_vars?.ok).toBe(true)
    expect(data.checks.countdown?.ok).toBe(true)
  }, 15_000)
})

describe('Security headers', () => {
  it('response includes required security headers', async () => {
    const res = await fetch(`${BASE_URL}/api/healthcheck`)
    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
    expect(res.headers.get('x-frame-options')).toBe('SAMEORIGIN')
    expect(res.headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin')
    expect(res.headers.get('content-security-policy')).toContain("default-src 'self'")
  }, 10_000)
})
