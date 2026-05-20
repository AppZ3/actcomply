// POST /api/newsletter/subscribe, public newsletter signup endpoint.
// Body: { email: string, source?: string }
// Idempotent: re-subscribing an existing email re-activates them and refreshes
// the unsubscribe token.

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getResend } from '@/lib/resend'
import { logError } from '@/lib/error-logger'
import { newUnsubscribeToken, welcomeEmailHtml } from '@/lib/newsletter'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.getactcomply.com'

export async function POST(req: NextRequest) {
  try {
    const { email, source } = await req.json()
    const cleanEmail = typeof email === 'string' ? email.toLowerCase().trim() : ''

    // Strict character set: blocks HTML-significant chars that would otherwise
    // be stored and later reflected by /api/newsletter/unsubscribe.
    if (
      !cleanEmail ||
      cleanEmail.length > 254 ||
      !/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(cleanEmail)
    ) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()
    const token = newUnsubscribeToken()
    const cleanSource = typeof source === 'string' ? source.slice(0, 64) : ''

    // Upsert: if this email already exists, reactivate it and refresh the token.
    // The previous token is invalidated by the swap, which is the intended UX.
    const { error: upsertErr } = await admin.from('newsletter_subscribers').upsert(
      {
        email: cleanEmail,
        status: 'active',
        source: cleanSource,
        unsubscribe_token: token,
        unsubscribed_at: null,
      },
      { onConflict: 'email' }
    )
    if (upsertErr) throw upsertErr

    const unsubUrl = `${APP_URL}/api/newsletter/unsubscribe?token=${token}`

    await getResend().emails.send({
      from: 'ActComply Newsletter <newsletter@getactcomply.com>',
      to: cleanEmail,
      replyTo: 'hello@getactcomply.com',
      subject: "You're in, ActComply newsletter",
      html: welcomeEmailHtml(unsubUrl),
      headers: {
        'List-Unsubscribe': `<${unsubUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    await logError(err, { route: 'POST /api/newsletter/subscribe' })
    // Don't leak DB or send errors to the public form, return success either
    // way so the form UX stays smooth. Errors are still logged.
    return NextResponse.json({ success: true })
  }
}
