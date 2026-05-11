// POST /api/orgs/[orgId]/members, invite a member to an org

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { logError } from '@/lib/error-logger'
import { sendInviteEmail } from '@/lib/resend'

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

    const admin = getSupabaseAdmin()

    // Verify requester owns or admins this org (use admin client to bypass RLS)
    const { data: org } = await admin
      .from('organizations')
      .select('id, owner_id, name')
      .eq('id', orgId)
      .single()
    if (!org) return NextResponse.json({ error: 'Organisation not found' }, { status: 404 })

    const isOwner = org.owner_id === user.id
    if (!isOwner) {
      const { data: adminRow } = await admin
        .from('org_members')
        .select('id')
        .eq('org_id', orgId)
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .eq('status', 'active')
        .single()
      if (!adminRow) return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Check if invitee already has an account by looking up profiles
    const { data: inviteeProfile } = await admin
      .from('profiles')
      .select('id')
      .ilike('email', email.trim())
      .single()
    const inviteeUserId = inviteeProfile?.id ?? null

    const { data, error } = await admin
      .from('org_members')
      .insert({
        org_id: orgId,
        email: email.trim().toLowerCase(),
        role,
        user_id: inviteeUserId,
        status: inviteeUserId ? 'active' : 'pending',
        accepted_at: inviteeUserId ? new Date().toISOString() : null,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'This email is already a member.' }, { status: 409 })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Notify the invitee. Best-effort, failure to send email must not roll back
    // the invite (it was the user's intent to invite, and the row is the source
    // of truth that the auth.user trigger uses to bind on signup).
    try {
      await sendInviteEmail({
        to: email.trim().toLowerCase(),
        orgName: org.name,
        inviterEmail: user.email ?? 'Someone',
        role,
      })
    } catch (emailErr) {
      await logError(emailErr, {
        route: 'POST /api/orgs/[orgId]/members [email]',
        userId: user.id,
        context: { orgId, invitee: email.trim().toLowerCase() },
      })
    }

    return NextResponse.json(data)
  } catch (err) {
    await logError(err, { route: 'POST /api/orgs/[orgId]/members', userId: user.id, userEmail: user.email, context: { orgId } })
    return NextResponse.json({ error: 'Failed to invite member.' }, { status: 500 })
  }
}
