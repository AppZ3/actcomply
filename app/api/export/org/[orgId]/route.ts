// GET /api/export/org/[orgId]
// Bundle every assessment + artefact for one organisation as a single JSON
// archive. Useful for handing a complete compliance pack to a client (or to a
// market-surveillance authority on request). Side letter §6 commits to this
// for white-label engagements, the per-org export is the "system of record"
// the client takes away when the engagement ends.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { logError } from '@/lib/error-logger'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // Verify the user has access to this org. RLS on `organizations` already
    // restricts to owner-or-active-member, so a successful read is the
    // authorisation check.
    const { data: org } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', orgId)
      .single()
    if (!org) return NextResponse.json({ error: 'Organisation not found' }, { status: 404 })

    const admin = getSupabaseAdmin()

    const { data: assessments } = await admin
      .from('assessments')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })

    const assessmentIds = (assessments ?? []).map(a => a.id as string)

    const empty = { data: [] as unknown[] }
    const [techDocs, loggingSpecs, gdprAssessments, riskPlans, progress, incidents] = assessmentIds.length > 0
      ? await Promise.all([
          admin.from('technical_docs').select('*').in('assessment_id', assessmentIds),
          admin.from('logging_specs').select('*').in('assessment_id', assessmentIds),
          admin.from('gdpr_assessments').select('*').in('assessment_id', assessmentIds),
          admin.from('risk_management_plans').select('*').in('assessment_id', assessmentIds),
          admin.from('requirement_progress').select('*').in('assessment_id', assessmentIds),
          admin.from('incidents').select('*').in('assessment_id', assessmentIds),
        ])
      : [empty, empty, empty, empty, empty, empty]

    const exportBundle = {
      export_metadata: {
        exported_at: new Date().toISOString(),
        org_id: orgId,
        org_name: org.name,
        assessment_count: assessments?.length ?? 0,
        regulation: 'Regulation (EU) 2024/1689, EU AI Act',
        note:
          'Complete compliance pack for this organisation. ' +
          'Retain for the duration required under Article 18 (10 years from market placement).',
      },
      assessments: assessments ?? [],
      technical_documentation: techDocs.data ?? [],
      logging_specifications: loggingSpecs.data ?? [],
      gdpr_dpia_fria: gdprAssessments.data ?? [],
      risk_management_plans: riskPlans.data ?? [],
      compliance_progress: progress.data ?? [],
      incidents: incidents.data ?? [],
    }

    const filename = `actcomply-${org.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`

    return new NextResponse(JSON.stringify(exportBundle, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    await logError(err, {
      route: 'GET /api/export/org/[orgId]',
      userId: user.id,
      userEmail: user.email,
      context: { orgId },
    })
    return NextResponse.json({ error: 'Export failed. Please try again.' }, { status: 500 })
  }
}
