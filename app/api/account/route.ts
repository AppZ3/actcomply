import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = getSupabaseAdmin()

  // Delete all user data then the auth user
  await Promise.all([
    admin.from('assessments').delete().eq('user_id', user.id),
    admin.from('requirement_progress').delete().eq('user_id', user.id),
    admin.from('technical_docs').delete().eq('user_id', user.id),
    admin.from('audit_log').delete().eq('user_id', user.id),
    admin.from('alert_reads').delete().eq('user_id', user.id),
  ])

  await admin.from('profiles').delete().eq('id', user.id)
  const { error } = await admin.auth.admin.deleteUser(user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
