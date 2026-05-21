// POST /api/support
// Receives support form submissions and forwards to the outreach tool pipeline.

import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/error-logger'

const OUTREACH_URL = 'https://outreach-tool-navy.vercel.app'

const MAX_EMAIL_LENGTH = 254
const MAX_NAME = 100
const MAX_SUBJECT = 200
const MAX_MESSAGE = 5000
const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/

const RATE_WINDOW_MS = 60 * 60 * 1000
const RATE_MAX_PER_WINDOW = 5
const rateLimitMap = new Map<string, { count: number; windowStart: number }>()

function checkRateLimit(key: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(key)
  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    rateLimitMap.set(key, { count: 1, windowStart: now })
    if (rateLimitMap.size > 1000) {
      const cutoff = now - RATE_WINDOW_MS
      for (const [k, v] of rateLimitMap.entries()) {
        if (v.windowStart < cutoff) rateLimitMap.delete(k)
      }
    }
    return true
  }
  if (entry.count >= RATE_MAX_PER_WINDOW) return false
  entry.count++
  return true
}

function clientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return req.headers.get('x-real-ip') || 'unknown'
}

function isSameOrigin(req: NextRequest): boolean {
  const host = req.headers.get('host')
  if (!host) return false
  const origin = req.headers.get('origin')
  if (origin) {
    try {
      return new URL(origin).host === host
    } catch {
      return false
    }
  }
  const referer = req.headers.get('referer')
  if (referer) {
    try {
      return new URL(referer).host === host
    } catch {
      return false
    }
  }
  return false
}

function cleanText(input: unknown, max: number): string {
  if (typeof input !== 'string') return ''
  const stripped = input.replace(/[\x00-\x1f\x7f]/g, ' ').trim()
  return stripped.length > max ? stripped.slice(0, max) : stripped
}

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  if (!checkRateLimit(clientIp(req))) {
    return NextResponse.json({ error: 'rate limited' }, { status: 429 })
  }

  const body: Record<string, unknown> = await req.json().catch(() => ({}))
  const emailRaw = typeof body.email === 'string' ? body.email.toLowerCase().trim() : ''
  if (!emailRaw || emailRaw.length > MAX_EMAIL_LENGTH || !EMAIL_RE.test(emailRaw)) {
    return NextResponse.json({ error: 'invalid email' }, { status: 400 })
  }
  const message = cleanText(body.message, MAX_MESSAGE)
  if (!message) {
    return NextResponse.json({ error: 'message is required' }, { status: 400 })
  }
  const name = cleanText(body.name, MAX_NAME) || 'Unknown'
  const subject = cleanText(body.subject, MAX_SUBJECT) || 'Support request'

  const forwardedBody = `Name: ${name}\nEmail: ${emailRaw}\n\n${message}`

  try {
    const res = await fetch(`${OUTREACH_URL}/api/support`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source_email: emailRaw,
        subject,
        body: forwardedBody,
      }),
    })
    if (!res.ok) return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    await logError(err, { route: 'POST /api/support' })
    return NextResponse.json({ error: 'Failed to submit request. Please email support directly.' }, { status: 500 })
  }
}
