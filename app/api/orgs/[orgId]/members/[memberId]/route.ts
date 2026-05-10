// DELETE /api/orgs/[orgId]/members/[memberId] — remove a member

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { logError } from '@/lib/error-logger'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ orgId: string; memberId: string }> }
) {
  const { orgId, memberId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // RLS on org_members enforces owner/admin check
    const { error } = await supabase
      .from('org_members')
      .delete()
      .eq('id', memberId)
      .eq('org_id', orgId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    await logError(err, { route: 'DELETE /api/orgs/[orgId]/members/[memberId]', userId: user.id, userEmail: user.email, context: { orgId, memberId } })
    return NextResponse.json({ error: 'Failed to remove member.' }, { status: 500 })
  }
}
