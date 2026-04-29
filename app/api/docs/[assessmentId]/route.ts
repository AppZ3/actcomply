// GET  /api/docs/[assessmentId]  → fetch existing technical doc
// POST /api/docs/[assessmentId]  → generate new doc with Claude, save to DB

export const maxDuration = 300

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getPlanFeatures } from '@/lib/stripe'
import Anthropic from '@anthropic-ai/sdk'

const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const DOC_TOOL = {
  name: 'generate_documentation',
  description: 'Generate EU AI Act Article 11 + Annex IV technical documentation',
  input_schema: {
    type: 'object' as const,
    required: ['title', 'generated_at', 'risk_level', 'regulatory_basis', 'sections'],
    properties: {
      title: { type: 'string' as const },
      generated_at: { type: 'string' as const },
      risk_level: { type: 'string' as const },
      regulatory_basis: { type: 'string' as const },
      sections: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          required: ['id', 'title', 'article_ref', 'content'],
          properties: {
            id: { type: 'string' as const },
            title: { type: 'string' as const },
            article_ref: { type: 'string' as const },
            content: { type: 'string' as const },
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
    .from('technical_docs')
    .select('*')
    .eq('assessment_id', assessmentId)
    .eq('user_id', user.id)
    .single()

  return NextResponse.json(data ? { ...data, content: data.sections } : null)
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
      { error: 'upgrade_required', message: 'Auto-generated technical documentation requires the Business plan or higher.' },
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

  // Fetch existing doc to preserve version history
  const admin = getSupabaseAdmin()
  const { data: existing } = await admin
    .from('technical_docs')
    .select('content')
    .eq('assessment_id', assessmentId)
    .eq('user_id', user.id)
    .single()

  const existingContent = existing?.content as Record<string, unknown> | null
  const previousVersions: unknown[] = Array.isArray(existingContent?.previous_versions)
    ? existingContent.previous_versions as unknown[]
    : []
  const nextVersion = typeof existingContent?.version === 'number' ? existingContent.version + 1 : 1

  // Archive current doc into version history (keep last 10)
  if (existingContent) {
    const archived = { ...existingContent }
    delete archived.previous_versions
    previousVersions.push(archived)
    if (previousVersions.length > 10) previousVersions.shift()
  }

  try {
    const msg = await ai.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      tools: [DOC_TOOL],
      tool_choice: { type: 'tool', name: 'generate_documentation' },
      system: `You are an EU AI Act compliance expert generating Article 11 + Annex IV technical documentation.
Write 10 sections. Each section content: 2-3 substantive paragraphs, specific to the system, audit-ready, citing real EU AI Act article numbers. No placeholder text. Be precise and thorough — this documentation may be reviewed by regulators or legal counsel.
Sections required: General Description, Intended Purpose and Deployment Context, Development and Training Methodology, Training Data and Data Governance, Performance Metrics and Validation Testing, Risk Management System, Human Oversight Measures, Transparency and Instructions for Use, Cybersecurity and Robustness, Post-Market Monitoring Plan.`,
      messages: [{
        role: 'user',
        content: `Generate technical documentation for this AI system:
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
- Compliance score: ${assessment.compliance_score}%
- generated_at: "${new Date().toISOString()}"`,
      }],
    })

    const toolBlock = msg.content.find(b => b.type === 'tool_use') as Anthropic.ToolUseBlock | undefined
    if (!toolBlock) throw new Error('No tool response from Claude')
    const doc = toolBlock.input as Record<string, unknown>

    doc.version = nextVersion
    doc.previous_versions = previousVersions

    const { error: upsertError } = await admin
      .from('technical_docs')
      .upsert(
        { user_id: user.id, assessment_id: assessmentId, sections: doc, generated_at: new Date().toISOString() },
        { onConflict: 'user_id,assessment_id' }
      )

    if (upsertError) return NextResponse.json({ error: 'db_error', message: `DB save failed: ${upsertError.message}` }, { status: 500 })

    return NextResponse.json(doc)
  } catch (err) {
    console.error('Docs generation error:', err instanceof Error ? err.stack : String(err))
    return NextResponse.json({ error: 'Documentation generation failed. Please try again.' }, { status: 500 })
  }
}
