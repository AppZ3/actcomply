// GET  /api/incidents/[assessmentId] — list all incidents for an assessment
// POST /api/incidents/[assessmentId] — log a new incident

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

function calcDeadline(discoveryDate: string, severity: string): string | null {
  if (severity === 'near_miss') return null
  const days = severity === 'immediate_risk' ? 1 : severity === 'serious' ? 15 : 90
  const d = new Date(discoveryDate)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

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
    .from('incidents')
    .select('*')
    .eq('assessment_id', assessmentId)
    .eq('user_id', user.id)
    .order('discovery_date', { ascending: false })

  return NextResponse.json(data ?? [])
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ assessmentId: string }> }
) {
  const { assessmentId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { title, description, severity, discovery_date, notes } = await req.json()
    if (!title || !description || !severity || !discovery_date) {
      return NextResponse.json({ error: 'title, description, severity, and discovery_date are required' }, { status: 400 })
    }

    const { data: assessment } = await supabase
      .from('assessments').select('id').eq('id', assessmentId).eq('user_id', user.id).single()
    if (!assessment) return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })

    const reporting_deadline = calcDeadline(discovery_date, severity)

    const admin = getSupabaseAdmin()
    const { data, error } = await admin
      .from('incidents')
      .insert({
        assessment_id: assessmentId,
        user_id: user.id,
        title,
        description,
        severity,
        discovery_date,
        reporting_deadline,
        notes: notes ?? null,
        status: 'discovered',
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err) {
    console.error('Incident create error:', err instanceof Error ? err.stack : String(err))
    return NextResponse.json({ error: 'Failed to log incident.' }, { status: 500 })
  }
}
