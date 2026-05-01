// DELETE /api/keys/[keyId] — revoke an API key

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ keyId: string }> }
) {
  const { keyId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const admin = getSupabaseAdmin()
    const { error } = await admin
      .from('api_keys')
      .delete()
      .eq('id', keyId)
      .eq('user_id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('API key delete error:', err instanceof Error ? err.stack : String(err))
    return NextResponse.json({ error: 'Failed to revoke API key.' }, { status: 500 })
  }
}
