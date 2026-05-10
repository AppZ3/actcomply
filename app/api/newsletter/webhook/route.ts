// POST /api/newsletter/webhook — Resend webhook for newsletter delivery events.
// Subscribe to: email.delivered, email.opened, email.clicked, email.bounced, email.complained
//
// Distinct from /api/resend-events (which lives in the outreach tool repo).
// Configure this URL in Resend per-domain or per-webhook so newsletter events
// don't get routed to the outreach DB by mistake.

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  const payload = await req.json()
  const type = payload?.type as string | undefined
  const resendId = payload?.data?.email_id as string | undefined

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
