// GET /api/newsletter/unsubscribe?token=<token>
// One-click unsubscribe. Marks the subscriber as unsubscribed and shows a
// minimal HTML confirmation page (no JavaScript needed — the unsubscribe link
// in emails should "just work" even with images blocked).

import { NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { logError } from '@/lib/error-logger'

function html(body: string, status = 200) {
  return new Response(
    `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Unsubscribe — ActComply</title>
  <style>
    body { margin:0; font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif; background:#f8fafc; color:#0f172a; }
    .wrap { max-width:560px; margin:80px auto; padding:24px; }
    .card { background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:32px; }
    h1 { margin:0 0 12px; font-size:22px; }
    p { color:#475569; line-height:1.7; margin:0 0 12px; font-size:15px; }
    a { color:#2563eb; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">${body}</div>
  </div>
</body>
</html>`,
    {
      status,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    }
  )
}

export async function GET(req: NextRequest) {
  try {
    const token = new URL(req.url).searchParams.get('token')
    if (!token) {
      return html('<h1>Invalid link</h1><p>This unsubscribe link is missing or expired.</p>', 400)
    }

    const admin = getSupabaseAdmin()
    const { data, error } = await admin
      .from('newsletter_subscribers')
      .select('id, email, status')
      .eq('unsubscribe_token', token)
      .single()

    if (error || !data) {
      return html(
        '<h1>Already unsubscribed</h1><p>We couldn\'t find an active subscription for this link. You\'re probably already off the list.</p><p><a href="https://getactcomply.com">Back to ActComply</a></p>',
        200
      )
    }

    if (data.status !== 'unsubscribed') {
      await admin
        .from('newsletter_subscribers')
        .update({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString() })
        .eq('id', data.id)
    }

    return html(
      `<h1>You're unsubscribed</h1>
       <p>${data.email} won't receive the ActComply newsletter anymore.</p>
       <p>Changed your mind? Just sign up again at <a href="https://getactcomply.com">getactcomply.com</a> — no hard feelings.</p>`,
      200
    )
  } catch (err) {
    await logError(err, { route: 'GET /api/newsletter/unsubscribe' })
    return html(
      '<h1>Something went wrong</h1><p>Try again, or email <a href="mailto:hello@getactcomply.com">hello@getactcomply.com</a> to be removed manually.</p>',
      500
    )
  }
}

// Some email clients fire one-click unsubscribe via POST. Accept it the same way.
export async function POST(req: NextRequest) {
  return GET(req)
}
