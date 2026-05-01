// POST /api/v1/assess — Enterprise public API
// Auth: Authorization: Bearer ac_<key>

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { assessAISystem, validateAssessmentInput, type AISystemInput } from '@/lib/anthropic'
import { createHash } from 'crypto'

async function resolveApiKey(req: NextRequest): Promise<{ userId: string } | null> {
  const auth = req.headers.get('authorization') ?? ''
  const raw = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  if (!raw.startsWith('ac_')) return null

  const keyHash = createHash('sha256').update(raw).digest('hex')
  const admin = getSupabaseAdmin()

  const { data } = await admin
    .from('api_keys')
    .select('id, user_id')
    .eq('key_hash', keyHash)
    .single()

  if (!data) return null

  await admin
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id)

  return { userId: data.user_id }
}

export async function POST(req: NextRequest) {
  try {
    const caller = await resolveApiKey(req)
    if (!caller) {
      return NextResponse.json({ error: 'Invalid or missing API key.' }, { status: 401 })
    }

    const body: AISystemInput = await req.json()

    if (!body.name || !body.description || !body.purpose || !body.sector) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, purpose, sector' },
        { status: 400 }
      )
    }

    const validation = await validateAssessmentInput(body)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.reason }, { status: 422 })
    }

    const result = await assessAISystem(body, { userId: caller.userId })

    return NextResponse.json({
      risk_level: result.riskLevel,
      compliance_score: result.complianceScore,
      risk_rationale: result.riskRationale,
      regulatory_basis: result.regulatoryBasis,
      requirements: result.requirements,
      immediate_actions: result.immediateActions,
      estimated_effort: result.estimatedEffort,
    })
  } catch (err) {
    console.error('v1/assess error:', err instanceof Error ? err.stack : String(err))
    return NextResponse.json({ error: 'Assessment failed.' }, { status: 500 })
  }
}
