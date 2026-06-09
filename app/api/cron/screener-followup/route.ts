export const maxDuration = 120

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getResend } from '@/lib/resend'
import { bearerOk } from '@/lib/auth-bearer'
import { logError } from '@/lib/error-logger'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.getactcomply.com'

export async function GET(req: NextRequest) {
  if (!bearerOk(req.headers.get('authorization'), process.env.CRON_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = getSupabaseAdmin()
  const now = new Date()

  // Day 3: leads completed between 4 days ago and 3 days ago
  const day3Max = new Date(now.getTime() - 3 * 86_400_000)
  const day3Min = new Date(now.getTime() - 4 * 86_400_000)

  // Day 7: leads completed between 8 days ago and 7 days ago
  const day7Max = new Date(now.getTime() - 7 * 86_400_000)
  const day7Min = new Date(now.getTime() - 8 * 86_400_000)

  const [{ data: day3Leads }, { data: day7Leads }] = await Promise.all([
    admin.from('screener_leads')
      .select('id, email, sector, risk_tier, annex_iii_category, deployment_stage, decisions_people, people_per_month')
      .eq('follow_up_day3_sent', false)
      .eq('consent', true)
      .gte('completed_at', day3Min.toISOString())
      .lte('completed_at', day3Max.toISOString()),
    admin.from('screener_leads')
      .select('id, email, sector, risk_tier, annex_iii_category, deployment_stage')
      .eq('follow_up_day7_sent', false)
      .eq('consent', true)
      .gte('completed_at', day7Min.toISOString())
      .lte('completed_at', day7Max.toISOString()),
  ])

  // Fetch trial signups to exclude
  const allEmails = [...(day3Leads ?? []), ...(day7Leads ?? [])].map(l => l.email)
  const { data: trialProfiles } = allEmails.length
    ? await admin.from('profiles').select('email').in('email', allEmails)
    : { data: [] }
  const trialSet = new Set((trialProfiles ?? []).map(p => p.email))

  let day3Sent = 0
  let day7Sent = 0

  for (const lead of (day3Leads ?? [])) {
    if (trialSet.has(lead.email)) {
      await admin.from('screener_leads').update({ follow_up_day3_sent: true }).eq('id', lead.id)
      continue
    }
    try {
      const articleLabel = lead.sector === 'Healthcare' ? 'Article 10 (data governance)'
        : lead.sector === 'Finance' ? 'Article 9 (risk management)'
        : lead.sector === 'HR & Recruitment' ? 'Article 9 (bias and fairness testing)'
        : lead.sector === 'Education' ? 'Article 11 (technical documentation)'
        : 'Article 11 (technical documentation)'

      await getResend().emails.send({
        from: 'ActComply <hello@getactcomply.com>',
        to: lead.email,
        subject: `The Article that matters most for ${lead.sector}`,
        html: day3EmailHtml({ lead, articleLabel, appUrl: APP_URL }),
      })
      await admin.from('screener_leads').update({ follow_up_day3_sent: true }).eq('id', lead.id)
      day3Sent++
    } catch (e) {
      logError(e, { route: `screener_day3_${lead.email}` }).catch(() => {})
    }
  }

  const daysLeft = Math.ceil((new Date('2026-08-02').getTime() - now.getTime()) / 86_400_000)

  for (const lead of (day7Leads ?? [])) {
    if (trialSet.has(lead.email)) {
      await admin.from('screener_leads').update({ follow_up_day7_sent: true }).eq('id', lead.id)
      continue
    }
    try {
      await getResend().emails.send({
        from: 'ActComply <hello@getactcomply.com>',
        to: lead.email,
        subject: `${daysLeft} days until August 2`,
        html: day7EmailHtml({ lead, daysLeft, appUrl: APP_URL }),
      })
      await admin.from('screener_leads').update({ follow_up_day7_sent: true }).eq('id', lead.id)
      day7Sent++
    } catch (e) {
      logError(e, { route: `screener_day7_${lead.email}` }).catch(() => {})
    }
  }

  return NextResponse.json({ day3Sent, day7Sent })
}

function day3EmailHtml({ lead, articleLabel, appUrl }: { lead: { email: string; sector: string }; articleLabel: string; appUrl: string }) {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111">
      <div style="background:#0f172a;padding:24px 32px;border-radius:12px 12px 0 0">
        <span style="color:#fff;font-weight:700;font-size:18px">ActComply</span>
      </div>
      <div style="padding:32px;background:#fff;border-radius:0 0 12px 12px;border:1px solid #e2e8f0">
        <p>For ${lead.sector} companies, the most pressing obligation under the EU AI Act is ${articleLabel}. This requires that your AI system has documented risk management processes before August 2.</p>
        <p>The Starter plan generates this documentation automatically from your system description. It takes about 20 minutes to complete for the first system.</p>
        <a href="${appUrl}/signup" style="display:inline-block;background:#0f172a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px">Start free trial</a>
        <p style="color:#94a3b8;font-size:12px;margin-top:32px"><a href="${appUrl}/api/newsletter/unsubscribe?email=${encodeURIComponent(lead.email)}">Unsubscribe</a></p>
      </div>
    </div>
  `
}

function day7EmailHtml({ lead, daysLeft, appUrl }: { lead: { email: string; sector: string }; daysLeft: number; appUrl: string }) {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111">
      <div style="background:#0f172a;padding:24px 32px;border-radius:12px 12px 0 0">
        <span style="color:#fff;font-weight:700;font-size:18px">ActComply</span>
      </div>
      <div style="padding:32px;background:#fff;border-radius:0 0 12px 12px;border:1px solid #e2e8f0">
        <p>Most ${lead.sector} companies with AI products have not started documentation yet. If you start a trial today you can have your Article 11 technical documentation in 20 minutes.</p>
        <p>${daysLeft} days until August 2.</p>
        <a href="${appUrl}/signup" style="display:inline-block;background:#0f172a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px">Start free trial</a>
        <p style="color:#94a3b8;font-size:12px;margin-top:32px"><a href="${appUrl}/api/newsletter/unsubscribe?email=${encodeURIComponent(lead.email)}">Unsubscribe</a></p>
      </div>
    </div>
  `
}
