// POST /api/v1/assess — Enterprise public API
// Auth: Authorization: Bearer ac_<key>
//
// Optional body field `org_id` scopes the new assessment to a specific
// organisation/workspace the caller has access to. Without it, the
// assessment lands in the API key owner's personal workspace.

import { NextRequest } from 'next/server'
import { assessAISystem, validateAssessmentInput, type AISystemInput } from '@/lib/anthropic'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { logError } from '@/lib/error-logger'
import { emitEvent } from '@/lib/webhooks'
import {
  resolveApiKey, callerHasOrgAccess,
  preflight, jsonWithCors, unauthorized, forbidden,
} from '@/lib/api-v1'

export async function OPTIONS() {
  return preflight()
}

type AssessBody = AISystemInput & { org_id?: string | null }

export async function POST(req: NextRequest) {
  const caller = await resolveApiKey(req)
  if (!caller) return unauthorized()

  try {
    const body = (await req.json()) as AssessBody

    if (!body.name || !body.description || !body.purpose || !body.sector) {
      return jsonWithCors(
        { error: 'Missing required fields: name, description, purpose, sector' },
        { status: 400 }
      )
    }

    const orgId = body.org_id ?? null
    if (orgId && !(await callerHasOrgAccess(caller, orgId))) {
      return forbidden(`You do not have access to org_id ${orgId}.`)
    }

    const validation = await validateAssessmentInput(body)
    if (!validation.valid) {
      return jsonWithCors({ error: validation.reason }, { status: 422 })
    }

    const result = await assessAISystem(body, { userId: caller.userId })

    // Persist so it appears in the dashboard and can be retrieved via
    // GET /api/v1/assessments/:id.
    const admin = getSupabaseAdmin()
    const { data: saved } = await admin
      .from('assessments')
      .insert({
        user_id: caller.userId,
        org_id: orgId,
        name: body.name,
        description: body.description,
        purpose: body.purpose,
        sector: body.sector,
        uses_personal_data: body.usesPersonalData ?? false,
        makes_autonomous_decisions: body.makesAutonomousDecisions ?? false,
        affects_individuals: body.affectsIndividuals ?? false,
        current_safeguards: body.currentSafeguards ?? '',
        risk_level: result.riskLevel,
        compliance_score: result.complianceScore,
        risk_rationale: result.riskRationale,
        regulatory_basis: result.regulatoryBasis,
        requirements: result.requirements,
        prohibited_reason: result.prohibitedReason ?? null,
        immediate_actions: result.immediateActions,
        estimated_effort: result.estimatedEffort,
      })
      .select('id')
      .single()

    const responsePayload = {
      id: saved?.id ?? null,
      org_id: orgId,
      risk_level: result.riskLevel,
      compliance_score: result.complianceScore,
      risk_rationale: result.riskRationale,
      regulatory_basis: result.regulatoryBasis,
      requirements: result.requirements,
      immediate_actions: result.immediateActions,
      estimated_effort: result.estimatedEffort,
    }

    // Fire any subscribed webhooks. Best-effort — failure does not affect
    // the API response. await ensures we surface delivery errors to the
    // caller's request lifetime budget rather than orphaning them.
    if (saved?.id) {
      try {
        await emitEvent({
          ownerUserId: caller.userId,
          orgId,
          event: 'assessment.created',
          payload: responsePayload,
        })
      } catch (whErr) {
        await logError(whErr, { route: 'POST /api/v1/assess [webhook]', userId: caller.userId })
      }
    }

    return jsonWithCors(responsePayload)
  } catch (err) {
    await logError(err, { route: 'POST /api/v1/assess', userId: caller.userId })
    return jsonWithCors({ error: 'Assessment failed.' }, { status: 500 })
  }
}
