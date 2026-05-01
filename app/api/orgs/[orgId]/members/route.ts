// POST /api/orgs/[orgId]/members — invite a member to an org

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { email, role = 'member' } = await req.json()
    if (!email?.trim()) return NextResponse.json({ error: 'email is required' }, { status: 400 })
    if (!['admin', 'member', 'viewer'].includes(role)) {
      return NextResponse.json({ error: 'role must be admin, member, or viewer' }, { status: 400 })
    }

    // Verify requester owns or admins this org
    const { data: org } = await supabase.from('organizations').select('id').eq('id', orgId).single()
    if (!org) return NextResponse.json({ error: 'Organisation not found' }, { status: 404 })

    const admin = getSupabaseAdmin()

    // Check if invitee has an account
    const { data: existingUser } = await admin.auth.admin.listUsers()
    const invitee = existingUser?.users.find(u => u.email === email.trim().toLowerCase())

    const { data, error } = await admin
      .from('org_members')
      .insert({
        org_id: orgId,
        email: email.trim().toLowerCase(),
        role,
        user_id: invitee?.id ?? null,
        status: invitee ? 'active' : 'pending',
        accepted_at: invitee ? new Date().toISOString() : null,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'This email is already a member.' }, { status: 409 })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error('Org member invite error:', err instanceof Error ? err.stack : String(err))
    return NextResponse.json({ error: 'Failed to invite member.' }, { status: 500 })
  }
}
