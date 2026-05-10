// GET  /api/logging/[assessmentId]  → fetch existing logging spec
// POST /api/logging/[assessmentId]  → generate new spec with Claude, save to DB

export const maxDuration = 120

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getPlanFeatures } from '@/lib/stripe'
import Anthropic from '@anthropic-ai/sdk'
import { logError } from '@/lib/error-logger'

const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const LOGGING_TOOL = {
  name: 'generate_logging_spec',
  description: 'Generate EU AI Act Article 12 logging specification and Article 19 retention schedule',
  input_schema: {
    type: 'object' as const,
    required: ['retention_period_months', 'retention_rationale', 'events', 'policy', 'retention_schedule'],
    properties: {
      retention_period_months: { type: 'number' as const },
      retention_rationale: { type: 'string' as const },
      events: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          required: ['id', 'name', 'article_ref', 'description', 'fields_to_log', 'trigger'],
          properties: {
            id: { type: 'string' as const },
            name: { type: 'string' as const },
            article_ref: { type: 'string' as const },
            description: { type: 'string' as const },
            fields_to_log: { type: 'array' as const, items: { type: 'string' as const } },
            trigger: { type: 'string' as const },
          },
        },
      },
      policy: {
        type: 'object' as const,
        required: ['storage_format', 'immutability', 'access_controls', 'integrity', 'review_frequency'],
        properties: {
          storage_format: { type: 'string' as const },
          immutability: { type: 'string' as const },
          access_controls: { type: 'string' as const },
          integrity: { type: 'string' as const },
          review_frequency: { type: 'string' as const },
        },
      },
      retention_schedule: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          required: ['record_type', 'retention_period', 'article', 'disposal_method'],
          properties: {
            record_type: { type: 'string' as const },
            retention_period: { type: 'string' as const },
            article: { type: 'string' as const },
            disposal_method: { type: 'string' as const },
          },
        },
      },
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
    .from('logging_specs')
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
      { error: 'upgrade_required', message: 'Logging specification requires the Business plan or higher.' },
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
      max_tokens: 3000,
      tools: [LOGGING_TOOL],
      tool_choice: { type: 'tool', name: 'generate_logging_spec' },
      system: `You are an EU AI Act compliance expert generating Article 12 logging specifications and Article 19 retention schedules.

Article 12 requires high-risk AI systems to automatically record events throughout their lifecycle. Logs must capture sufficient detail to enable post-hoc auditing and accountability.

Article 19 sets minimum retention periods:
- General high-risk AI: 6 months minimum
- Law enforcement, migration control, justice: 3 years minimum
- Provider technical documentation: 10 years after placing on market

Generate a precise, implementable logging specification tailored to the specific AI system. Each event should name the exact data fields to capture. Be specific to the system's sector and use case — not generic.`,
      messages: [{
        role: 'user',
        content: `Generate an Article 12 logging specification and Article 19 retention schedule for this AI system:

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

Determine the correct Article 19 retention period based on the sector and purpose. Generate 4–6 specific logging events relevant to this system's actual operation. For each event, specify the exact fields the system must record. Keep descriptions concise — 1–2 sentences each.`,
      }],
    })

    const toolBlock = msg.content.find(b => b.type === 'tool_use') as Anthropic.ToolUseBlock | undefined
    if (!toolBlock) throw new Error('No tool response from Claude')
    const spec = toolBlock.input as Record<string, unknown>
    spec.generated_at = new Date().toISOString()

    const admin = getSupabaseAdmin()
    const { data: existing } = await admin
      .from('logging_specs')
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

    spec.version = nextVersion
    spec.previous_versions = previousVersions

    await admin
      .from('logging_specs')
      .upsert(
        { user_id: user.id, assessment_id: assessmentId, content: spec, generated_at: new Date().toISOString() },
        { onConflict: 'user_id,assessment_id' }
      )

    return NextResponse.json(spec)
  } catch (err) {
    await logError(err, { route: 'POST /api/logging/[assessmentId]', userId: user.id, userEmail: user.email, userPlan: profile?.plan, context: { assessmentId } })
    return NextResponse.json({ error: 'Generation failed. Please try again.' }, { status: 500 })
  }
}
