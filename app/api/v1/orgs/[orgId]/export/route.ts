// GET /api/v1/orgs/[orgId]/export, single-archive JSON of every assessment
// + child artefact for one organisation. The "system of record export" Tariq
// Law-style consultancies hand to the client at engagement end (per side
// letter §6 commitment).

import { NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { logError } from '@/lib/error-logger'
import {
  resolveApiKey, callerHasOrgAccess,
  preflight, jsonWithCors, unauthorized, forbidden, CORS_HEADERS,
} from '@/lib/api-v1'

export async function OPTIONS() {
  return preflight()
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const caller = await resolveApiKey(req)
  if (!caller) return unauthorized()

  const { orgId } = await params

  try {
    if (!(await callerHasOrgAccess(caller, orgId))) {
      return forbidden(`You do not have access to org_id ${orgId}.`)
    }

    const admin = getSupabaseAdmin()
    const { data: org } = await admin
      .from('organizations')
      .select('id, name, owner_id, created_at')
      .eq('id', orgId)
      .single()
    if (!org) return jsonWithCors({ error: 'Organisation not found.' }, { status: 404 })

    const { data: assessments } = await admin
      .from('assessments').select('*').eq('org_id', orgId).order('created_at', { ascending: false })

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

    const bundle = {
      export_metadata: {
        exported_at: new Date().toISOString(),
        org_id: org.id,
        org_name: org.name,
        assessment_count: assessments?.length ?? 0,
        regulation: 'Regulation (EU) 2024/1689, EU AI Act',
        note:
          'Complete compliance pack for this organisation. Retain for the ' +
          'duration required under Article 18 (10 years from market placement).',
      },
      organisation: org,
      assessments: assessments ?? [],
      technical_documentation: techDocs.data ?? [],
      logging_specifications: loggingSpecs.data ?? [],
      gdpr_dpia_fria: gdprAssessments.data ?? [],
      risk_management_plans: riskPlans.data ?? [],
      compliance_progress: progress.data ?? [],
      incidents: incidents.data ?? [],
    }

    const filename = `actcomply-${org.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`
    return new Response(JSON.stringify(bundle, null, 2), {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    await logError(err, { route: 'GET /api/v1/orgs/[orgId]/export', userId: caller.userId, context: { orgId } })
    return jsonWithCors({ error: 'Export failed.' }, { status: 500 })
  }
}
