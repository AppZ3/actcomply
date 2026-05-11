// GET  /api/alerts          → list all alerts with read status for current user
// POST /api/alerts/[id]/read → mark an alert as read (handled below)

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getPlanFeatures } from '@/lib/stripe'
import { logError } from '@/lib/error-logger'

// Seed alerts if none exist, real EU AI Act milestones
const SEED_ALERTS = [
  {
    title: 'Prohibited AI systems ban now in force',
    summary: 'As of February 2, 2025, all AI systems listed under Article 5 (prohibited practices) are banned in the EU. This includes social scoring by public authorities, real-time biometric surveillance in public spaces, and manipulation of vulnerable groups. Ensure none of your systems fall under these categories.',
    article_refs: 'Article 5',
    severity: 'critical',
    published_at: '2025-02-02T00:00:00Z',
  },
  {
    title: 'GPAI model obligations in force since August 2025',
    summary: 'General Purpose AI (GPAI) model providers must now comply with Articles 53–55 including transparency obligations, copyright summaries, and adversarial testing. Providers of GPAI models with systemic risk face additional requirements. Review your use of foundation models.',
    article_refs: 'Articles 53–55',
    severity: 'warning',
    published_at: '2025-08-02T00:00:00Z',
  },
  {
    title: 'EU AI Office published high-risk classification guidance',
    summary: 'The EU AI Office released updated guidance clarifying which AI systems fall under Annex III high-risk categories. Key clarifications cover HR screening tools, credit scoring models, and biometric categorisation systems. Review your systems against the updated guidance.',
    article_refs: 'Annex III, Article 6',
    severity: 'info',
    published_at: '2026-01-15T00:00:00Z',
  },
  {
    title: 'August 2, 2026: Enforcement powers go live, inventory must be complete',
    summary: 'From August 2, 2026, supervisory authorities have full enforcement powers and are expected to review compliance with prohibited AI and GPAI obligations already in force. All organisations must have completed their AI inventory and classification by this date. High-risk system obligations (Annex III) have been extended to December 2, 2027 under the Omnibus agreement, but the regulator\'s starting pistol fires August 2 regardless.',
    article_refs: 'Articles 5, 53–55, Annex III',
    severity: 'critical',
    published_at: '2026-04-15T00:00:00Z',
  },
  {
    title: 'Omnibus agreement: High-risk AI deadlines extended',
    summary: 'A provisional political agreement reached in May 2026 extends key EU AI Act deadlines. High-risk AI systems (Annex III standalone) now face full obligations from December 2, 2027. High-risk AI embedded in regulated products (Annex I) has until August 2, 2028. The agreement requires formal adoption by Parliament and Council. Until then, treat August 2, 2026 as operative. Critically: enforcement powers are live from August 2, 2026 regardless of the Omnibus timeline.',
    article_refs: 'Annex I, Annex III, Articles 9–27',
    severity: 'warning',
    published_at: '2026-05-08T00:00:00Z',
  },
  {
    title: 'Notified body accreditation process open',
    summary: 'National accreditation bodies across EU member states are now accepting applications from conformity assessment bodies seeking designation as notified bodies under the EU AI Act. High-risk AI system providers who require third-party conformity assessments should identify their relevant notified body early.',
    article_refs: 'Articles 33–39',
    severity: 'info',
    published_at: '2026-03-01T00:00:00Z',
  },
]

// POST /api/alerts, create a new alert and email all active paid users (internal use)
export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.ALERTS_ADMIN_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { title, summary, article_refs, severity } = await req.json()
  if (!title || !summary || !article_refs || !severity) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const admin = getSupabaseAdmin()

  try {
    const { data: alert, error } = await admin
      .from('regulatory_alerts')
      .insert({ title, summary, article_refs, severity, published_at: new Date().toISOString() })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const { data: profiles } = await admin
      .from('profiles')
      .select('email')
      .eq('subscription_status', 'active')
      .neq('plan', 'free')

    const { sendAlertEmail } = await import('@/lib/resend')
    const results = await Promise.allSettled(
      (profiles ?? []).map(p =>
        sendAlertEmail({ to: p.email, title, summary, articleRefs: article_refs, severity })
      )
    )

    const sent = results.filter(r => r.status === 'fulfilled').length
    return NextResponse.json({ alert, emailsSent: sent })
  } catch (err) {
    await logError(err, { route: 'POST /api/alerts' })
    return NextResponse.json({ error: 'Failed to create alert.' }, { status: 500 })
  }
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
  const { alertFrequency } = getPlanFeatures(profile?.plan)

  if (alertFrequency === 'none') {
    return NextResponse.json({ error: 'upgrade_required', plan_required: 'starter' }, { status: 403 })
  }

  const admin = getSupabaseAdmin()

  // Seed if table is empty
  const { count } = await admin
    .from('regulatory_alerts')
    .select('*', { count: 'exact', head: true })

  if (count === 0) {
    await admin.from('regulatory_alerts').insert(SEED_ALERTS)
  }

  let query = admin
    .from('regulatory_alerts')
    .select('*')
    .order('published_at', { ascending: false })

  if (alertFrequency === 'monthly') {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 30)
    query = query.gte('published_at', cutoff.toISOString())
  }

  const { data: alerts } = await query

  const { data: reads } = await admin
    .from('alert_reads')
    .select('alert_id')
    .eq('user_id', user.id)

  const readIds = new Set((reads ?? []).map(r => r.alert_id))

  const result = (alerts ?? []).map(a => ({
    ...a,
    read: readIds.has(a.id),
  }))

  return NextResponse.json(result)
}
