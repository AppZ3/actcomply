// POST /api/newsletter/webhook, Resend webhook for newsletter delivery events.
// Subscribe to: email.delivered, email.opened, email.clicked, email.bounced, email.complained
//
// Distinct from /api/resend-events (which lives in the outreach tool repo).
// Configure this URL in Resend per-domain or per-webhook so newsletter events
// don't get routed to the outreach DB by mistake.
//
// Signature verification: Resend delivers via Svix. The signing secret lives in
// NEWSLETTER_WEBHOOK_SECRET (whsec_... format). Without a valid signature we
// reject, anyone who guessed the URL could otherwise forge delivery/bounce
// events and corrupt newsletter_sends.

import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

const FIVE_MINUTES = 60 * 5

function verifySvixSignature(body: string, req: NextRequest, secret: string): boolean {
  const id = req.headers.get('svix-id') ?? req.headers.get('webhook-id')
  const timestamp = req.headers.get('svix-timestamp') ?? req.headers.get('webhook-timestamp')
  const signatureHeader = req.headers.get('svix-signature') ?? req.headers.get('webhook-signature')
  if (!id || !timestamp || !signatureHeader) return false

  const ts = Number(timestamp)
  if (!Number.isFinite(ts)) return false
  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - ts) > FIVE_MINUTES) return false

  const secretBytes = Buffer.from(secret.replace(/^whsec_/, ''), 'base64')
  const expected = createHmac('sha256', secretBytes)
    .update(`${id}.${timestamp}.${body}`)
    .digest()

  // svix-signature can be "v1,sig1 v1,sig2" during rotation
  for (const part of signatureHeader.split(' ')) {
    const [, sig] = part.split(',')
    if (!sig) continue
    const sigBytes = Buffer.from(sig, 'base64')
    if (sigBytes.length === expected.length && timingSafeEqual(sigBytes, expected)) {
      return true
    }
  }
  return false
}

export async function POST(req: NextRequest) {
  const secret = process.env.NEWSLETTER_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 503 })
  }

  const body = await req.text()
  if (!verifySvixSignature(body, req, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload: { type?: string; data?: { email_id?: string } }
  try {
    payload = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const type = payload?.type
  const resendId = payload?.data?.email_id

  if (!resendId) return NextResponse.json({ received: true })

  const admin = getSupabaseAdmin()
  const now = new Date().toISOString()

  if (type === 'email.delivered') {
    await admin
      .from('newsletter_sends')
      .update({ delivered_at: now })
      .eq('resend_id', resendId)
      .is('delivered_at', null)
  }

  if (type === 'email.opened') {
    await admin
      .from('newsletter_sends')
      .update({ opened_at: now })
      .eq('resend_id', resendId)
      .is('opened_at', null)
  }

  if (type === 'email.clicked') {
    await admin
      .from('newsletter_sends')
      .update({ clicked_at: now })
      .eq('resend_id', resendId)
      .is('clicked_at', null)
    await admin
      .from('newsletter_sends')
      .update({ opened_at: now })
      .eq('resend_id', resendId)
      .is('opened_at', null)
  }

  if (type === 'email.bounced') {
    await admin
      .from('newsletter_sends')
      .update({ bounced_at: now })
      .eq('resend_id', resendId)
      .is('bounced_at', null)
    // Auto-mark subscriber as bounced so future issues skip them
    const { data: send } = await admin
      .from('newsletter_sends')
      .select('subscriber_id')
      .eq('resend_id', resendId)
      .single()
    if (send) {
      await admin
        .from('newsletter_subscribers')
        .update({ status: 'bounced' })
        .eq('id', send.subscriber_id)
    }
  }

  if (type === 'email.complained') {
    await admin
      .from('newsletter_sends')
      .update({ complained_at: now })
      .eq('resend_id', resendId)
      .is('complained_at', null)
    const { data: send } = await admin
      .from('newsletter_sends')
      .select('subscriber_id')
      .eq('resend_id', resendId)
      .single()
    if (send) {
      await admin
        .from('newsletter_subscribers')
        .update({ status: 'complained', unsubscribed_at: now })
        .eq('id', send.subscriber_id)
    }
  }

  return NextResponse.json({ received: true })
}
