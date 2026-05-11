// POST /api/newsletter/send, send a newsletter issue to all active subscribers.
// Auth: Authorization: Bearer <NEWSLETTER_ADMIN_SECRET>
//
// Body:
//   {
//     "slug": "issue-001-eu-ai-act-for-builders",   // unique short id
//     "subject": "Article 50 is going to bite, here's what to do",
//     "body": "Plain-text body, paragraphs separated by blank lines."
//   }
//
// Saves the issue (idempotent on slug) then sends to every active subscriber.
// Records a row in newsletter_sends per recipient.

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getResend } from '@/lib/resend'
import { logError } from '@/lib/error-logger'
import { bodyToHtml, newsletterShellHtml } from '@/lib/newsletter'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.getactcomply.com'

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const secret = process.env.NEWSLETTER_ADMIN_SECRET
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { slug, subject, body, dryRun } = await req.json()
    if (!slug || !subject || !body) {
      return NextResponse.json({ error: 'slug, subject, and body are required' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()
    const bodyHtml = bodyToHtml(body)

    // Save the issue (idempotent on slug). If it was already sent, refuse.
    const { data: existing } = await admin
      .from('newsletter_issues')
      .select('id, sent_at')
      .eq('slug', slug)
      .maybeSingle()

    if (existing?.sent_at && !dryRun) {
      return NextResponse.json(
        { error: `Issue "${slug}" was already sent at ${existing.sent_at}` },
        { status: 409 }
      )
    }

    const issueId =
      existing?.id ??
      (
        await admin
          .from('newsletter_issues')
          .insert({ slug, subject, body_md: body, body_html: bodyHtml })
          .select('id')
          .single()
      ).data?.id

    if (!issueId) throw new Error('Failed to create issue')

    // If updating an existing draft, refresh the rendered fields
    if (existing) {
      await admin
        .from('newsletter_issues')
        .update({ subject, body_md: body, body_html: bodyHtml })
        .eq('id', issueId)
    }

    // Fetch active subscribers
    const { data: subs, error: subsErr } = await admin
      .from('newsletter_subscribers')
      .select('id, email, unsubscribe_token')
      .eq('status', 'active')
    if (subsErr) throw subsErr

    if (dryRun) {
      return NextResponse.json({
        ok: true,
        dryRun: true,
        issue_id: issueId,
        would_send_to: subs?.length ?? 0,
      })
    }

    const resend = getResend()
    let sent = 0
    const errors: string[] = []

    // Send sequentially. At our scale (low hundreds) this is fine. Switch to
    // Resend's batch API once we're > 1000 subs.
    for (const s of subs ?? []) {
      const unsubUrl = `${APP_URL}/api/newsletter/unsubscribe?token=${s.unsubscribe_token}`
      const html = newsletterShellHtml({
        subject,
        bodyHtml,
        unsubscribeUrl: unsubUrl,
      })

      try {
        const result = await resend.emails.send({
          from: 'ActComply Newsletter <newsletter@getactcomply.com>',
          to: s.email,
          replyTo: 'hello@getactcomply.com',
          subject,
          html,
          headers: {
            'List-Unsubscribe': `<${unsubUrl}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        })

        if (result.error) {
          errors.push(`${s.email}: ${result.error.message}`)
          continue
        }

        await admin.from('newsletter_sends').insert({
          issue_id: issueId,
          subscriber_id: s.id,
          resend_id: result.data?.id ?? null,
        })
        sent++
      } catch (err) {
        errors.push(`${s.email}: ${String(err)}`)
        await logError(err, { route: 'POST /api/newsletter/send', context: { email: s.email, issueId } })
      }
    }

    await admin
      .from('newsletter_issues')
      .update({ sent_at: new Date().toISOString(), sent_count: sent })
      .eq('id', issueId)

    return NextResponse.json({
      ok: true,
      issue_id: issueId,
      sent,
      total: subs?.length ?? 0,
      errors: errors.slice(0, 20),
    })
  } catch (err) {
    await logError(err, { route: 'POST /api/newsletter/send' })
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
