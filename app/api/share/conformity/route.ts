// POST /api/share/conformity — create a share token for an assessment's conformity pack
// DELETE /api/share/conformity — revoke a share token

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { assessmentId, label, expiresInDays } = await req.json()
    if (!assessmentId) return NextResponse.json({ error: 'assessmentId required' }, { status: 400 })

    // Confirm ownership
    const { data: assessment } = await supabase
      .from('assessments')
      .select('id')
      .eq('id', assessmentId)
      .eq('user_id', user.id)
      .single()

    if (!assessment) return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })

    const admin = getSupabaseAdmin()

    // Revoke any existing token for this assessment first (one active token per assessment)
    await admin
      .from('conformity_share_tokens')
      .delete()
      .eq('assessment_id', assessmentId)
      .eq('user_id', user.id)

    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 86_400_000).toISOString()
      : null

    const { data: tokenRow, error } = await admin
      .from('conformity_share_tokens')
      .insert({
        assessment_id: assessmentId,
        user_id: user.id,
        label: label ?? null,
        expires_at: expiresAt,
      })
      .select('token')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ token: tokenRow.token })
  } catch (err) {
    console.error('Share token create error:', err instanceof Error ? err.stack : String(err))
    return NextResponse.json({ error: 'Failed to create share link.' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { assessmentId } = await req.json()
    if (!assessmentId) return NextResponse.json({ error: 'assessmentId required' }, { status: 400 })

    const admin = getSupabaseAdmin()
    await admin
      .from('conformity_share_tokens')
      .delete()
      .eq('assessment_id', assessmentId)
      .eq('user_id', user.id)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Share token delete error:', err instanceof Error ? err.stack : String(err))
    return NextResponse.json({ error: 'Failed to revoke share link.' }, { status: 500 })
  }
}
