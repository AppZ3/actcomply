// GET  /api/progress?assessmentId=xxx  → fetch all progress for an assessment
// POST /api/progress                   → upsert a requirement's status/notes

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const assessmentId = req.nextUrl.searchParams.get('assessmentId')
  if (!assessmentId) return NextResponse.json({ error: 'assessmentId required' }, { status: 400 })

  const { data, error } = await supabase
    .from('requirement_progress')
    .select('requirement_id, status, notes, updated_at')
    .eq('user_id', user.id)
    .eq('assessment_id', assessmentId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { assessmentId, requirementId, status, notes } = await req.json()

  const { error } = await supabase
    .from('requirement_progress')
    .upsert(
      {
        user_id: user.id,
        assessment_id: assessmentId,
        requirement_id: requirementId,
        status,
        notes: notes ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,assessment_id,requirement_id' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
