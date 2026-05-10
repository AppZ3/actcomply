// PATCH /api/incidents/[assessmentId]/[incidentId] — update status, authority, notes

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { logError } from '@/lib/error-logger'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ assessmentId: string; incidentId: string }> }
) {
  const { assessmentId, incidentId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const allowed = ['status', 'authority_name', 'report_reference', 'reported_at', 'notes']
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
    for (const key of allowed) {
      if (key in body) patch[key] = body[key]
    }

    // Auto-set reported_at when marking as reported
    if (body.status === 'reported' && !body.reported_at) {
      patch.reported_at = new Date().toISOString()
    }

    const admin = getSupabaseAdmin()
    const { data, error } = await admin
      .from('incidents')
      .update(patch)
      .eq('id', incidentId)
      .eq('assessment_id', assessmentId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'Incident not found' }, { status: 404 })
    return NextResponse.json(data)
  } catch (err) {
    await logError(err, { route: 'PATCH /api/incidents/[assessmentId]/[incidentId]', userId: user.id, userEmail: user.email, context: { assessmentId, incidentId } })
    return NextResponse.json({ error: 'Failed to update incident.' }, { status: 500 })
  }
}
