// GET /api/v1/assessments/[id], read a single assessment + every artefact
// (technical doc, risk plan, logging spec, GDPR DPIA/FRIA, requirement
// progress, incidents) attached to it. Mirrors the per-assessment dashboard
// view as a single bundle for integrators.
//
// Auth: Authorization: Bearer ac_<key>. Caller must own the assessment OR
// be an active member of its scoping org (RLS-equivalent check).

import { NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { logError } from '@/lib/error-logger'
import {
  resolveApiKey, callerHasOrgAccess,
  preflight, jsonWithCors, unauthorized, forbidden,
} from '@/lib/api-v1'

export async function OPTIONS() {
  return preflight()
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const caller = await resolveApiKey(req)
  if (!caller) return unauthorized()

  const { id } = await params
  const admin = getSupabaseAdmin()

  try {
    const { data: assessment } = await admin
      .from('assessments')
      .select('*')
      .eq('id', id)
      .single()

    if (!assessment) {
      return jsonWithCors({ error: 'Assessment not found.' }, { status: 404 })
    }

    // Authorization: caller is owner, OR caller has access to the assessment's org.
    const isOwner = assessment.user_id === caller.userId
    const isOrgMember = assessment.org_id ? await callerHasOrgAccess(caller, assessment.org_id) : false
    if (!isOwner && !isOrgMember) {
      return forbidden('You do not have access to this assessment.')
    }

    const [techDoc, loggingSpec, gdprAssessment, riskPlan, progress, incidents] = await Promise.all([
      admin.from('technical_docs').select('*').eq('assessment_id', id).maybeSingle(),
      admin.from('logging_specs').select('*').eq('assessment_id', id).maybeSingle(),
      admin.from('gdpr_assessments').select('*').eq('assessment_id', id).maybeSingle(),
      admin.from('risk_management_plans').select('*').eq('assessment_id', id).maybeSingle(),
      admin.from('requirement_progress').select('*').eq('assessment_id', id),
      admin.from('incidents').select('*').eq('assessment_id', id),
    ])

    return jsonWithCors({
      assessment,
      technical_documentation: techDoc.data,
      logging_specification: loggingSpec.data,
      gdpr_dpia_fria: gdprAssessment.data,
      risk_management_plan: riskPlan.data,
      compliance_progress: progress.data ?? [],
      incidents: incidents.data ?? [],
    })
  } catch (err) {
    await logError(err, { route: 'GET /api/v1/assessments/[id]', userId: caller.userId, context: { id } })
    return jsonWithCors({ error: 'Failed to read assessment.' }, { status: 500 })
  }
}
