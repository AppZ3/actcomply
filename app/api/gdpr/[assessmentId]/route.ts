// GET  /api/gdpr/[assessmentId]  → fetch existing DPIA/FRIA
// POST /api/gdpr/[assessmentId]  → generate with Claude, save to DB

export const maxDuration = 120

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getPlanFeatures } from '@/lib/stripe'
import Anthropic from '@anthropic-ai/sdk'

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
      max_tokens: 6000,
      tools: [GDPR_TOOL],
      tool_choice: { type: 'tool', name: 'generate_gdpr_assessment' },
      system: `You are an expert in GDPR (Regulation EU 2016/679) and the EU AI Act (Regulation EU 2024/1689), specialising in Data Protection Impact Assessments (DPIA) and Fundamental Rights Impact Assessments (FRIA).

Key legal context:
- GDPR Article 35: DPIA required for systematic and extensive profiling, large-scale special-category data processing, or systematic monitoring of public areas
- EU AI Act Article 27: FRIA required for deployers of high-risk AI in areas covered by Annex III points 1, 2, 3, 5, 6, 7, 8 — assessing impact on fundamental rights
- GDPR Article 9/10: Special-category data (health, biometric, racial/ethnic origin, etc.) requires explicit legal basis
- EU AI Act Article 86: Affected persons have a right to explanation for AI-assisted decisions
- GDPR Article 22: Restrictions on solely automated decision-making — human oversight required

Generate a precise, integrated assessment. Be specific to the system's actual processing activities and sector. Identify real risks — do not produce a generic checklist. For fundamental rights, assess specifically which rights are impacted and at what level (none/low/medium/high). The explainability statement should describe what explanation can realistically be given to affected persons about this specific system's decisions.`,
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

Assess whether a DPIA and FRIA are each required. Identify 2–4 processing activities. Generate a risk register with 4–6 specific risks. Assess fundamental rights impacts across relevant rights (non-discrimination, privacy, fair trial, effective remedy, etc.). Write an Article 86 explainability statement specific to this system. List existing and recommended safeguards.`,
      }],
    })

    const toolBlock = msg.content.find(b => b.type === 'tool_use') as Anthropic.ToolUseBlock | undefined
    if (!toolBlock) throw new Error('No tool response from Claude')
    const result = toolBlock.input as Record<string, unknown>
    result.generated_at = new Date().toISOString()

    const admin = getSupabaseAdmin()
    await admin
      .from('gdpr_assessments')
      .upsert(
        { user_id: user.id, assessment_id: assessmentId, content: result, generated_at: new Date().toISOString() },
        { onConflict: 'user_id,assessment_id' }
      )

    return NextResponse.json(result)
  } catch (err) {
    console.error('GDPR assessment error:', err instanceof Error ? err.stack : String(err))
    return NextResponse.json({ error: 'Generation failed. Please try again.' }, { status: 500 })
  }
}
