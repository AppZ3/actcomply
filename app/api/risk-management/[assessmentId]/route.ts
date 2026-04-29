// GET  /api/risk-management/[assessmentId]  → fetch existing plan
// POST /api/risk-management/[assessmentId]  → generate with Claude, save to DB

export const maxDuration = 120

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getPlanFeatures } from '@/lib/stripe'
import Anthropic from '@anthropic-ai/sdk'

const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const RISK_MGMT_TOOL = {
  name: 'generate_risk_management_plan',
  description: 'Generate an Article 9 EU AI Act risk management plan for a high-risk AI system',
  input_schema: {
    type: 'object' as const,
    required: [
      'overall_risk_level', 'overall_rationale',
      'risk_items', 'change_triggers', 'testing_requirements',
      'residual_risk_communication', 'review_interval_months',
    ],
    properties: {
      overall_risk_level: { type: 'string' as const, enum: ['low', 'medium', 'high', 'critical'] },
      overall_rationale: { type: 'string' as const },
      risk_items: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          required: ['id', 'category', 'risk', 'article_ref', 'probability', 'severity', 'measures', 'residual_risk', 'monitoring_indicator'],
          properties: {
            id: { type: 'string' as const },
            category: { type: 'string' as const },
            risk: { type: 'string' as const },
            article_ref: { type: 'string' as const },
            probability: { type: 'string' as const, enum: ['low', 'medium', 'high'] },
            severity: { type: 'string' as const, enum: ['low', 'medium', 'high', 'critical'] },
            measures: { type: 'array' as const, items: { type: 'string' as const } },
            residual_risk: { type: 'string' as const, enum: ['low', 'medium', 'high'] },
            monitoring_indicator: { type: 'string' as const },
          },
        },
      },
      change_triggers: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          required: ['trigger', 'article_ref', 'urgency', 'required_action'],
          properties: {
            trigger: { type: 'string' as const },
            article_ref: { type: 'string' as const },
            urgency: { type: 'string' as const, enum: ['immediate', 'within_30_days', 'next_review'] },
            required_action: { type: 'string' as const },
          },
        },
      },
      testing_requirements: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          required: ['test', 'frequency', 'article_ref', 'method'],
          properties: {
            test: { type: 'string' as const },
            frequency: { type: 'string' as const },
            article_ref: { type: 'string' as const },
            method: { type: 'string' as const },
          },
        },
      },
      residual_risk_communication: { type: 'string' as const },
      review_interval_months: { type: 'number' as const },
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
    .from('risk_management_plans')
    .select('*')
    .eq('assessment_id', assessmentId)
    .eq('user_id', user.id)
    .single()

  return NextResponse.json(data ?? null)
}

export async function POST(
  req: NextRequest,
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
      { error: 'upgrade_required', message: 'Article 9 risk management plans require the Business plan or higher.' },
      { status: 403 }
    )
  }

  // Check if this is a model-change re-prompt
  const body = await req.json().catch(() => ({}))
  const modelChanged: boolean = body?.model_changed ?? false

  const { data: assessment } = await supabase
    .from('assessments')
    .select('*')
    .eq('id', assessmentId)
    .eq('user_id', user.id)
    .single()

  if (!assessment) return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })

  // Fetch existing plan for re-prompt context
  const admin = getSupabaseAdmin()
  const { data: existing } = await admin
    .from('risk_management_plans')
    .select('content')
    .eq('assessment_id', assessmentId)
    .eq('user_id', user.id)
    .single()

  const modelChangeNote = modelChanged
    ? '\n\nIMPORTANT: The operator has flagged a model change event. Re-evaluate all risks under Article 9(4) — in particular data drift, performance degradation, and any new failure modes introduced by the updated model. Update monitoring indicators and change triggers accordingly.'
    : ''

  const existingContext = existing
    ? `\n\nPrevious risk plan summary (update it — do not simply repeat):\n- Overall level: ${(existing.content as Record<string,unknown>).overall_risk_level}\n- ${((existing.content as Record<string, unknown>).risk_items as unknown[])?.length ?? 0} risks identified\n- Review interval: ${(existing.content as Record<string,unknown>).review_interval_months} months`
    : ''

  try {
    const msg = await ai.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3500,
      tools: [RISK_MGMT_TOOL],
      tool_choice: { type: 'tool', name: 'generate_risk_management_plan' },
      system: `You are an expert in EU AI Act Article 9 risk management for high-risk AI systems.

Key legal requirements:
- Article 9(1): Establish, implement, document, and maintain a risk management system throughout the entire AI lifecycle
- Article 9(2): Identify and analyse known and foreseeable risks; estimate and evaluate risks; adopt suitable risk management measures
- Article 9(4): Risk management measures must consider effects and possible interaction of requirements from Articles 10–15; give consideration to the state of the art; adopt the most appropriate risk management measures
- Article 9(6): High-risk AI systems shall be tested to identify the most appropriate risk management measures; testing shall ensure consistent performance and compliance with this Regulation
- Article 9(7): Testing procedures shall be suitable to achieve the intended purpose; shall identify the most appropriate risk management measures
- Article 9(8): Testing shall be performed before placing on the market; representative test data covering the intended purpose and foreseeable misuse
- Article 9(9): Providers shall give due consideration to technical knowledge, experience, education, and training of users

Generate a precise, actionable Article 9 risk management plan. Identify failure modes specific to this system's sector and purpose. Risk categories must cover: accuracy/performance, data quality, human oversight failures, misuse/misapplication, transparency failures, and sector-specific risks. Change triggers must cover: model updates, data distribution shifts, regulatory changes, new deployment contexts, and incident discovery.`,
      messages: [{
        role: 'user',
        content: `Generate an Article 9 EU AI Act risk management plan for this AI system:

- Name: ${assessment.name}
- Description: ${assessment.description}
- Purpose: ${assessment.purpose}
- Sector: ${assessment.sector}
- Uses personal data: ${assessment.uses_personal_data}
- Makes autonomous decisions: ${assessment.makes_autonomous_decisions}
- Affects individuals: ${assessment.affects_individuals}
- Current safeguards: ${assessment.current_safeguards || 'None described'}
- Risk level: ${assessment.risk_level}
- Regulatory basis: ${assessment.regulatory_basis}${existingContext}${modelChangeNote}

Identify 4–5 specific risks with probability/severity/residual risk ratings. Generate 3–4 change triggers with urgency ratings. Generate 3–4 testing requirements with frequency and method. Specify the review interval (6, 12, or 24 months based on risk level). Write a concise residual risk communication statement (3–4 sentences) describing what residual risks remain and how they will be communicated to deployers/users.`,
      }],
    })

    const toolBlock = msg.content.find(b => b.type === 'tool_use') as Anthropic.ToolUseBlock | undefined
    if (!toolBlock) throw new Error('No tool response from Claude')
    const result = toolBlock.input as Record<string, unknown>
    result.generated_at = new Date().toISOString()
    result.model_changed_trigger = modelChanged

    await admin
      .from('risk_management_plans')
      .upsert(
        { user_id: user.id, assessment_id: assessmentId, content: result, generated_at: new Date().toISOString() },
        { onConflict: 'user_id,assessment_id' }
      )

    return NextResponse.json(result)
  } catch (err) {
    console.error('Risk management plan error:', err instanceof Error ? err.stack : String(err))
    return NextResponse.json({ error: 'Generation failed. Please try again.' }, { status: 500 })
  }
}
