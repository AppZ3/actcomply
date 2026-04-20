// GET  /api/docs/[assessmentId]  → fetch existing technical doc
// POST /api/docs/[assessmentId]  → generate new doc with Claude, save to DB

export const maxDuration = 60 // Vercel Pro: respected. Hobby: ignored (10s cap applies)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getPlanFeatures } from '@/lib/stripe'
import Anthropic from '@anthropic-ai/sdk'

const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ assessmentId: string }> }
) {
  const { assessmentId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('technical_docs')
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

  // Check plan — tech docs require Business or Enterprise
  const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
  const features = getPlanFeatures(profile?.plan)
  if (!features.techDocsEnabled) {
    return NextResponse.json(
      { error: 'upgrade_required', message: 'Auto-generated technical documentation requires the Business plan or higher.' },
      { status: 403 }
    )
  }

  // Fetch the assessment
  const { data: assessment } = await supabase
    .from('assessments')
    .select('*')
    .eq('id', assessmentId)
    .eq('user_id', user.id)
    .single()

  if (!assessment) return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })

  const msg = await ai.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3000,
    system: [
      {
        type: 'text',
        text: `You are a EU AI Act compliance expert generating Article 11 + Annex IV technical documentation for high-risk AI systems.

Generate complete Article 11 + Annex IV technical documentation. Return ONLY valid JSON (no markdown), structured exactly as:
{
  "title": "Technical Documentation — [system name]",
  "generated_at": "[ISO timestamp]",
  "risk_level": "[risk level]",
  "regulatory_basis": "[regulatory basis]",
  "sections": [
    { "id": "s1", "title": "1. General Description", "article_ref": "Annex IV, Section 1", "content": "..." },
    { "id": "s2", "title": "2. Intended Purpose and Deployment Context", "article_ref": "Article 13, Annex IV Section 1(b)", "content": "..." },
    { "id": "s3", "title": "3. Development and Training Methodology", "article_ref": "Annex IV, Section 2", "content": "..." },
    { "id": "s4", "title": "4. Training Data and Data Governance", "article_ref": "Article 10, Annex IV Section 2(d)", "content": "..." },
    { "id": "s5", "title": "5. Performance Metrics and Validation Testing", "article_ref": "Article 9(7), Annex IV Section 3", "content": "..." },
    { "id": "s6", "title": "6. Risk Management System", "article_ref": "Article 9, Annex IV Section 5", "content": "..." },
    { "id": "s7", "title": "7. Human Oversight Measures", "article_ref": "Article 14, Annex IV Section 5", "content": "..." },
    { "id": "s8", "title": "8. Transparency and Instructions for Use", "article_ref": "Article 13, Annex IV Section 4", "content": "..." },
    { "id": "s9", "title": "9. Cybersecurity and Robustness", "article_ref": "Article 15, Annex IV Section 5", "content": "..." },
    { "id": "s10", "title": "10. Post-Market Monitoring Plan", "article_ref": "Article 72, Annex IV Section 6", "content": "..." }
  ]
}

Write each section with substantive, specific content tailored to the system. Do not use placeholder text — every section must be audit-ready. Reference actual EU AI Act article numbers throughout.`,
        cache_control: { type: 'ephemeral' },
      },
    ],
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

Use generated_at: "${new Date().toISOString()}", risk_level: "${assessment.risk_level}", regulatory_basis: "${assessment.regulatory_basis}"`,
    }],
  })

  const raw = (msg.content[0] as { type: string; text: string }).text
    .replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
  const doc = JSON.parse(raw)

  const admin = getSupabaseAdmin()
  await admin
    .from('technical_docs')
    .upsert(
      { user_id: user.id, assessment_id: assessmentId, content: doc, generated_at: new Date().toISOString() },
      { onConflict: 'user_id,assessment_id' }
    )

  return NextResponse.json(doc)
}
