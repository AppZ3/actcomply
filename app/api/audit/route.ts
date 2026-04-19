import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getPlanFeatures } from '@/lib/stripe'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
  const features = getPlanFeatures(profile?.plan)
  if (!features.auditTrailEnabled) {
    return NextResponse.json(
      { error: 'upgrade_required', message: 'Audit trail requires the Business plan or higher.' },
      { status: 403 }
    )
  }

  const assessmentId = req.nextUrl.searchParams.get('assessmentId')
  if (!assessmentId) return NextResponse.json({ error: 'assessmentId required' }, { status: 400 })

  const { data, error } = await supabase
    .from('audit_log')
    .select('id, action, detail, created_at')
    .eq('user_id', user.id)
    .eq('assessment_id', assessmentId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
