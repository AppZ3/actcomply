// GET  /api/docs/[assessmentId]  → fetch existing technical doc
// POST /api/docs/[assessmentId]  → generate new doc with Claude, save to DB

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
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

  // Fetch the assessment
  const { data: assessment } = await supabase
    .from('assessments')
    .select('*')
    .eq('id', assessmentId)
    .eq('user_id', user.id)
    .single()

  if (!assessment) return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })

  const msg = await ai.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: `You are a EU AI Act compliance expert generating Article 11 + Annex IV technical documentation for a high-risk AI system.

AI System Details:
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

Generate complete Article 11 + Annex IV technical documentation. Return ONLY valid JSON (no markdown), structured exactly as:
{
  "title": "Technical Documentation — [system name]",
  "generated_at": "${new Date().toISOString()}",
  "risk_level": "${assessment.risk_level}",
  "regulatory_basis": "${assessment.regulatory_basis}",
  "sections": [
    {
      "id": "s1",
      "title": "1. General Description",
      "article_ref": "Annex IV, Section 1",
      "content": "Detailed general description of the AI system including its intended purpose, the persons responsible for development, and the version used."
    },
    {
      "id": "s2",
      "title": "2. Intended Purpose and Deployment Context",
      "article_ref": "Article 13, Annex IV Section 1(b)",
      "content": "..."
    },
    {
      "id": "s3",
      "title": "3. Development and Training Methodology",
      "article_ref": "Annex IV, Section 2",
      "content": "..."
    },
    {
      "id": "s4",
      "title": "4. Training Data and Data Governance",
      "article_ref": "Article 10, Annex IV Section 2(d)",
      "content": "..."
    },
    {
      "id": "s5",
      "title": "5. Performance Metrics and Validation Testing",
      "article_ref": "Article 9(7), Annex IV Section 3",
      "content": "..."
    },
    {
      "id": "s6",
      "title": "6. Risk Management System",
      "article_ref": "Article 9, Annex IV Section 5",
      "content": "..."
    },
    {
      "id": "s7",
      "title": "7. Human Oversight Measures",
      "article_ref": "Article 14, Annex IV Section 5",
      "content": "..."
    },
    {
      "id": "s8",
      "title": "8. Transparency and Instructions for Use",
      "article_ref": "Article 13, Annex IV Section 4",
      "content": "..."
    },
    {
      "id": "s9",
      "title": "9. Cybersecurity and Robustness",
      "article_ref": "Article 15, Annex IV Section 5",
      "content": "..."
    },
    {
      "id": "s10",
      "title": "10. Post-Market Monitoring Plan",
      "article_ref": "Article 72, Annex IV Section 6",
      "content": "..."
    }
  ]
}

Write each section with substantive, specific content based on the system details above. Do not use placeholder text — every section must be filled with realistic, audit-ready content tailored to this specific AI system. Be precise and reference actual EU AI Act articles throughout.`,
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
