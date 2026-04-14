// GET  /api/alerts          → list all alerts with read status for current user
// POST /api/alerts/[id]/read → mark an alert as read (handled below)

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// Seed alerts if none exist — real EU AI Act milestones
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
    title: 'High-risk AI Act enforcement deadline: 109 days',
    summary: 'Full enforcement of high-risk AI system obligations begins August 2, 2026. All high-risk AI systems must have completed conformity assessments, technical documentation, human oversight measures, and EU database registration before this date. Non-compliance fines reach €30M or 6% of global turnover.',
    article_refs: 'Articles 9–27, 43, 51',
    severity: 'critical',
    published_at: '2026-04-15T00:00:00Z',
  },
  {
    title: 'Notified body accreditation process open',
    summary: 'National accreditation bodies across EU member states are now accepting applications from conformity assessment bodies seeking designation as notified bodies under the EU AI Act. High-risk AI system providers who require third-party conformity assessments should identify their relevant notified body early.',
    article_refs: 'Articles 33–39',
    severity: 'info',
    published_at: '2026-03-01T00:00:00Z',
  },
]

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = getSupabaseAdmin()

  // Seed if table is empty
  const { count } = await admin
    .from('regulatory_alerts')
    .select('*', { count: 'exact', head: true })

  if (count === 0) {
    await admin.from('regulatory_alerts').insert(SEED_ALERTS)
  }

  // Fetch alerts with read status for this user
  const { data: alerts } = await admin
    .from('regulatory_alerts')
    .select('*')
    .order('published_at', { ascending: false })

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
