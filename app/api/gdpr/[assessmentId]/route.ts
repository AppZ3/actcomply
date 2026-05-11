// GET  /api/gdpr/[assessmentId]  → fetch existing DPIA/FRIA
// POST /api/gdpr/[assessmentId]  → generate with Claude, save to DB

export const maxDuration = 120

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getPlanFeatures } from '@/lib/stripe'
import Anthropic from '@anthropic-ai/sdk'
import { logError } from '@/lib/error-logger'

const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const GDPR_TOOL = {
  name: 'generate_gdpr_assessment',
  description: 'Generate an integrated GDPR DPIA (Article 35) and EU AI Act FRIA (Article 27) for a high-risk AI system',
  input_schema: {
    type: 'object' as const,
    required: [
      'dpia_required', 'dpia_rationale', 'fria_required', 'fria_rationale',
      'processing_activities', 'risks', 'fundamental_rights_impacts',
      'explainability_statement', 'safeguards', 'consultation_required', 'consultation_rationale',
    ],
    properties: {
      dpia_required: { type: 'boolean' as const },
      dpia_rationale: { type: 'string' as const },
      fria_required: { type: 'boolean' as const },
      fria_rationale: { type: 'string' as const },
      processing_activities: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          required: ['id', 'name', 'legal_basis', 'special_category', 'necessity_assessment', 'proportionality'],
          properties: {
            id: { type: 'string' as const },
            name: { type: 'string' as const },
            legal_basis: { type: 'string' as const },
            special_category: { type: 'boolean' as const },
            special_category_condition: { type: 'string' as const },
            necessity_assessment: { type: 'string' as const },
            proportionality: { type: 'string' as const },
          },
        },
      },
      risks: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          required: ['id', 'risk', 'likelihood', 'severity', 'mitigation', 'residual_risk'],
          properties: {
            id: { type: 'string' as const },
            risk: { type: 'string' as const },
            likelihood: { type: 'string' as const },
            severity: { type: 'string' as const },
            mitigation: { type: 'string' as const },
            residual_risk: { type: 'string' as const },
          },
        },
      },
      fundamental_rights_impacts: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          required: ['right', 'affected_groups', 'impact_level', 'mitigation'],
          properties: {
            right: { type: 'string' as const },
            affected_groups: { type: 'array' as const, items: { type: 'string' as const } },
            impact_level: { type: 'string' as const },
            mitigation: { type: 'string' as const },
          },
        },
      },
      explainability_statement: { type: 'string' as const },
      safeguards: { type: 'array' as const, items: { type: 'string' as const } },
      consultation_required: { type: 'boolean' as const },
      consultation_rationale: { type: 'string' as const },
    },
  },
} satisfies Anthropic.Tool

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ assessmentId: string }> }
) {
  const { assessmentId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = getSupabaseAdmin()
  const { data } = await admin
    .from('gdpr_assessments')
    .select('*')
    .eq('assessment_id', assessmentId)
    .eq('user_id', user.id)
    .single()

  return NextResponse.json(data ?? null)
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ assessmentId: string }> }
) {
  const { assessmentId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
  const features = getPlanFeatures(profile?.plan)
  if (!features.techDocsEnabled) {
    return NextResponse.json(
      { error: 'upgrade_required', message: 'GDPR DPIA + FRIA generation requires the Business plan or higher.' },
      { status: 403 }
    )
  }

  const { data: assessment } = await supabase
    .from('assessments')
    .select('*')
    .eq('id', assessmentId)
    .eq('user_id', user.id)
    .single()

  if (!assessment) return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })

  try {
    const msg = await ai.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3500,
      tools: [GDPR_TOOL],
      tool_choice: { type: 'tool', name: 'generate_gdpr_assessment' },
      system: `You are an expert in GDPR (Regulation EU 2016/679) and the EU AI Act (Regulation EU 2024/1689), specialising in Data Protection Impact Assessments (DPIA) and Fundamental Rights Impact Assessments (FRIA).

Key legal context:
- GDPR Article 35: DPIA required for systematic and extensive profiling, large-scale special-category data processing, or systematic monitoring of public areas
- EU AI Act Article 27: FRIA required for deployers of high-risk AI in areas covered by Annex III points 1, 2, 3, 5, 6, 7, 8, assessing impact on fundamental rights
- GDPR Article 9/10: Special-category data (health, biometric, racial/ethnic origin, etc.) requires explicit legal basis
- EU AI Act Article 86: Affected persons have a right to explanation for AI-assisted decisions
- GDPR Article 22: Restrictions on solely automated decision-making, human oversight required

Generate a precise, integrated assessment. Be specific to the system's actual processing activities and sector. Identify real risks, do not produce a generic checklist. For fundamental rights, assess specifically which rights are impacted and at what level (none/low/medium/high). The explainability statement should describe what explanation can realistically be given to affected persons about this specific system's decisions.`,
      messages: [{
        role: 'user',
        content: `Generate an integrated GDPR DPIA + EU AI Act FRIA for this AI system:

- Name: ${assessment.name}
- Description: ${assessment.description}
- Purpose: ${assessment.purpose}
- Sector: ${assessment.sector}
- Uses personal data: ${assessment.uses_personal_data}
- Makes autonomous decisions: ${assessment.makes_autonomous_decisions}
- Affects individuals: ${assessment.affects_individuals}
- Current safeguards: ${assessment.current_safeguards || 'None described'}
- Risk level: ${assessment.risk_level}
- Regulatory basis: ${assessment.regulatory_basis}

Produce ALL of the following, every field is required and every list must be populated. None of these are optional:

1. dpia_required + dpia_rationale (1–2 sentences each)
2. fria_required + fria_rationale (1–2 sentences each)
3. processing_activities, 2–3 items with legal_basis (e.g. "Article 6(1)(b) GDPR, contract necessity"), special-category condition where applicable, necessity_assessment, proportionality
4. risks, 3–4 specific risks (not generic). Each with likelihood, severity, mitigation, residual_risk
5. fundamental_rights_impacts, 3–4 affected rights from {non-discrimination, privacy, fair trial, effective remedy, dignity, freedom of expression}, each with affected_groups, impact_level (none/low/medium/high), mitigation
6. explainability_statement, 3–5 sentences, Article 86 compliant, specific to this system
7. safeguards, 4–6 concrete safeguards. Examples for HR-AI: "quarterly bias audit on protected attributes", "human oversight: recruiter reviews top-30 cutoff before shortlist export", "dataset minimisation: store only fields required for scoring", "encryption at rest using AES-256", "right-to-explanation portal for candidates", "incident escalation path to DPO". Concrete actions, not platitudes.
8. consultation_required (boolean) + consultation_rationale (1–2 sentences), under GDPR Article 36, prior consultation with the supervisory authority is required when residual high risk remains after safeguards. State true only if at least one risk has residual_risk = "high" or higher, otherwise false. Always provide consultation_rationale explaining the determination.

Keep each free-text field to 2–3 sentences maximum. Do not omit any field, empty arrays or missing fields will fail validation.`,
      }],
    })

    const toolBlock = msg.content.find(b => b.type === 'tool_use') as Anthropic.ToolUseBlock | undefined
    if (!toolBlock) throw new Error('No tool response from Claude')
    let result = toolBlock.input as Record<string, unknown>

    // Detect Claude omissions BEFORE backfilling so we can decide whether to retry.
    // Empty arrays from Claude = trust them. Missing fields = retry once.
    const missingBeforeBackfill: string[] = []
    if (typeof result.safeguards === 'undefined') missingBeforeBackfill.push('safeguards')
    if (typeof result.consultation_required === 'undefined') missingBeforeBackfill.push('consultation_required')
    if (typeof result.consultation_rationale === 'undefined') missingBeforeBackfill.push('consultation_rationale')
    if (typeof result.fundamental_rights_impacts === 'undefined') missingBeforeBackfill.push('fundamental_rights_impacts')
    if (typeof result.explainability_statement === 'undefined') missingBeforeBackfill.push('explainability_statement')

    if (missingBeforeBackfill.length > 0) {
      // One follow-up call asking Claude to fill ONLY the missing fields, with the
      // existing fields echoed back as context so it doesn't drift.
      const partial = JSON.stringify(result, null, 2).slice(0, 4000)
      const retry = await ai.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        tools: [GDPR_TOOL],
        tool_choice: { type: 'tool', name: 'generate_gdpr_assessment' },
        messages: [{
          role: 'user',
          content: `Your previous tool call for the DPIA + FRIA on this AI system OMITTED these required fields: ${missingBeforeBackfill.join(', ')}.

Re-emit the full tool call with EVERY field populated, including the previously-omitted ones. The fields you already produced are correct, keep them. The omitted fields must be substantive and specific to this system.

System: ${assessment.name} (${assessment.sector}, risk level ${assessment.risk_level}).

Previous (incomplete) call:
${partial}`,
        }],
      })
      const retryBlock = retry.content.find(b => b.type === 'tool_use') as Anthropic.ToolUseBlock | undefined
      if (retryBlock) {
        const retried = retryBlock.input as Record<string, unknown>
        // Merge: retry takes precedence for fields it now provides
        for (const k of Object.keys(retried)) {
          if (typeof retried[k] !== 'undefined') result[k] = retried[k]
        }
      }
    }

    // Final defensive backfill in case the retry also missed something -
    // never ship a half-populated artefact to the renderer.
    if (typeof result.dpia_required !== 'boolean') result.dpia_required = false
    if (typeof result.fria_required !== 'boolean') result.fria_required = false
    if (typeof result.dpia_rationale !== 'string') result.dpia_rationale = ''
    if (typeof result.fria_rationale !== 'string') result.fria_rationale = ''
    if (!Array.isArray(result.processing_activities)) result.processing_activities = []
    if (!Array.isArray(result.risks)) result.risks = []
    if (!Array.isArray(result.fundamental_rights_impacts)) result.fundamental_rights_impacts = []
    if (typeof result.explainability_statement !== 'string') result.explainability_statement = ''
    if (!Array.isArray(result.safeguards)) result.safeguards = []
    if (typeof result.consultation_required !== 'boolean') result.consultation_required = false
    if (typeof result.consultation_rationale !== 'string') result.consultation_rationale = ''

    result.generated_at = new Date().toISOString()

    const admin = getSupabaseAdmin()
    const { data: existing } = await admin
      .from('gdpr_assessments')
      .select('content')
      .eq('assessment_id', assessmentId)
      .eq('user_id', user.id)
      .single()

    const existingContent = existing?.content as Record<string, unknown> | null
    const previousVersions: unknown[] = Array.isArray(existingContent?.previous_versions)
      ? existingContent.previous_versions as unknown[]
      : []
    const nextVersion = typeof existingContent?.version === 'number' ? existingContent.version + 1 : 1

    if (existingContent) {
      const archived = { ...existingContent }
      delete archived.previous_versions
      previousVersions.push(archived)
      if (previousVersions.length > 10) previousVersions.shift()
    }

    result.version = nextVersion
    result.previous_versions = previousVersions

    await admin
      .from('gdpr_assessments')
      .upsert(
        { user_id: user.id, assessment_id: assessmentId, content: result, generated_at: new Date().toISOString() },
        { onConflict: 'user_id,assessment_id' }
      )

    return NextResponse.json(result)
  } catch (err) {
    await logError(err, { route: 'POST /api/gdpr/[assessmentId]', userId: user.id, userEmail: user.email, userPlan: profile?.plan, context: { assessmentId } })
    return NextResponse.json({ error: 'Generation failed. Please try again.' }, { status: 500 })
  }
}
