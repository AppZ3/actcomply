// GET /api/export/[assessmentId] — download all compliance records as JSON

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { logError } from '@/lib/error-logger'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ assessmentId: string }> }
) {
  const { assessmentId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = getSupabaseAdmin()

  try {
    const [
      { data: assessment },
      { data: techDoc },
      { data: loggingSpec },
      { data: gdprAssessment },
      { data: riskPlan },
      { data: progress },
      { data: incidents },
      { data: auditLog },
    ] = await Promise.all([
      supabase.from('assessments').select('*').eq('id', assessmentId).eq('user_id', user.id).single(),
      admin.from('technical_docs').select('*').eq('assessment_id', assessmentId).eq('user_id', user.id).single(),
      admin.from('logging_specs').select('*').eq('assessment_id', assessmentId).eq('user_id', user.id).single(),
      admin.from('gdpr_assessments').select('*').eq('assessment_id', assessmentId).eq('user_id', user.id).single(),
      admin.from('risk_management_plans').select('*').eq('assessment_id', assessmentId).eq('user_id', user.id).single(),
      supabase.from('requirement_progress').select('*').eq('assessment_id', assessmentId).eq('user_id', user.id),
      admin.from('incidents').select('*').eq('assessment_id', assessmentId).eq('user_id', user.id).order('discovery_date', { ascending: false }),
      admin.from('audit_log').select('*').eq('assessment_id', assessmentId).eq('user_id', user.id).order('created_at', { ascending: false }),
    ])

    if (!assessment) return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })

    const exportBundle = {
      export_metadata: {
        exported_at: new Date().toISOString(),
        assessment_id: assessmentId,
        system_name: assessment.name,
        regulation: 'Regulation (EU) 2024/1689 — EU AI Act',
        note: 'This export contains all compliance records for this AI system. Retain for the duration required under Article 18 (10 years from market placement).',
      },
      system: assessment,
      compliance_progress: progress ?? [],
      technical_documentation: techDoc ? { ...techDoc, content: techDoc.sections } : null,
      logging_specification: loggingSpec ?? null,
      gdpr_dpia_fria: gdprAssessment ?? null,
      risk_management_plan: riskPlan ?? null,
      incidents: incidents ?? [],
      audit_log: auditLog ?? [],
    }

    const filename = `actcomply-${assessment.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`

    return new NextResponse(JSON.stringify(exportBundle, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    await logError(err, { route: 'GET /api/export/[assessmentId]', userId: user.id, userEmail: user.email, context: { assessmentId } })
    return NextResponse.json({ error: 'Export failed. Please try again.' }, { status: 500 })
  }
}
