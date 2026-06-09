export const maxDuration = 120

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getResend } from '@/lib/resend'
import { bearerOk } from '@/lib/auth-bearer'
import { logError } from '@/lib/error-logger'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.getactcomply.com'
const NURTURE_EMAIL_CAP = 3

export async function GET(req: NextRequest) {
  if (!bearerOk(req.headers.get('authorization'), process.env.CRON_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = getSupabaseAdmin()
  const threeDaysAgo = new Date(Date.now() - 3 * 86_400_000).toISOString()

  // Free users created more than 3 days ago
  const { data: freeUsers } = await admin
    .from('profiles')
    .select('id, email, created_at')
    .eq('plan', 'free')
    .lte('created_at', threeDaysAgo)
    .limit(100)

  if (!freeUsers?.length) return NextResponse.json({ sent: 0 })

  // Count nurture emails already sent per user (from audit_log)
  const userIds = freeUsers.map(u => u.id)
  const { data: nurtureLog } = await admin
    .from('audit_log')
    .select('user_id')
    .in('user_id', userIds)
    .eq('action', 'trial_nurture_email')

  const nurtureCount = new Map<string, number>()
  for (const row of (nurtureLog ?? [])) {
    nurtureCount.set(row.user_id, (nurtureCount.get(row.user_id) ?? 0) + 1)
  }

  let sent = 0
  for (const user of freeUsers) {
    const emailsSent = nurtureCount.get(user.id) ?? 0
    if (emailsSent >= NURTURE_EMAIL_CAP) continue

    // Check if user has created any system
    const { count: systemCount } = await admin
      .from('ai_systems')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    try {
      if (!systemCount || systemCount === 0) {
        await getResend().emails.send({
          from: 'ActComply <hello@getactcomply.com>',
          to: user.email,
          subject: 'Your EU AI Act classification is waiting',
          html: noSystemHtml({ email: user.email, appUrl: APP_URL }),
        })
      } else {
        const { data: progress } = await admin
          .from('requirement_progress')
          .select('requirement_id, status')
          .eq('user_id', user.id)
          .eq('status', 'not_started')
          .limit(1)

        const rawGap = progress?.[0]?.requirement_id ?? 'technical documentation'
        const gap = rawGap.replace(/[<>"'&]/g, '')

        await getResend().emails.send({
          from: 'ActComply <hello@getactcomply.com>',
          to: user.email,
          subject: 'One step that could matter before August 2',
          html: hasSystemHtml({ email: user.email, gap, appUrl: APP_URL }),
        })
      }

      await admin.from('audit_log').insert({
        user_id: user.id,
        action: 'trial_nurture_email',
        details: { emails_sent_so_far: emailsSent + 1 },
      })
      sent++
    } catch (e) {
      logError(e, { route: `trial_nurture_${user.email}` }).catch(() => {})
    }
  }

  return NextResponse.json({ sent })
}

function noSystemHtml({ email, appUrl }: { email: string; appUrl: string }) {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111">
      <div style="background:#0f172a;padding:24px 32px;border-radius:12px 12px 0 0">
        <span style="color:#fff;font-weight:700;font-size:18px">ActComply</span>
      </div>
      <div style="padding:32px;background:#fff;border-radius:0 0 12px 12px;border:1px solid #e2e8f0">
        <p>You created an ActComply account but have not classified your AI system yet.</p>
        <p>It takes 5 minutes. Once you describe what your AI does, we generate your Article 11 technical documentation, risk management plan, and compliance checklist.</p>
        <a href="${appUrl}/dashboard/systems/new" style="display:inline-block;background:#0f172a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px">Classify your first system</a>
        <p style="color:#94a3b8;font-size:12px;margin-top:32px"><a href="${appUrl}/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}">Unsubscribe</a></p>
      </div>
    </div>
  `
}

function hasSystemHtml({ email, gap, appUrl }: { email: string; gap: string; appUrl: string }) {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111">
      <div style="background:#0f172a;padding:24px 32px;border-radius:12px 12px 0 0">
        <span style="color:#fff;font-weight:700;font-size:18px">ActComply</span>
      </div>
      <div style="padding:32px;background:#fff;border-radius:0 0 12px 12px;border:1px solid #e2e8f0">
        <p>Your biggest outstanding compliance gap is: <strong>${gap}</strong>.</p>
        <p>The Starter plan generates this automatically. Upgrade to complete your compliance before August 2.</p>
        <a href="${appUrl}/dashboard" style="display:inline-block;background:#0f172a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px">Complete your compliance</a>
        <p style="color:#94a3b8;font-size:12px;margin-top:32px"><a href="${appUrl}/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}">Unsubscribe</a></p>
      </div>
    </div>
  `
}
