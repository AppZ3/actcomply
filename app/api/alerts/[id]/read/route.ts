// POST /api/alerts/[id]/read — mark an alert as read for the current user

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = getSupabaseAdmin()
  await admin
    .from('alert_reads')
    .upsert({ user_id: user.id, alert_id: id }, { onConflict: 'user_id,alert_id' })

  return NextResponse.json({ ok: true })
}
