// POST /api/admin/provision, create or upgrade a user to Enterprise sandbox
// Protected by ADMIN_SECRET bearer token (same pattern as CRON_SECRET)

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getPlanFeatures } from '@/lib/stripe'
import { logError } from '@/lib/error-logger'

const ENTERPRISE_LIMIT = getPlanFeatures('enterprise').systemsLimit

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? ''
  if (!process.env.ADMIN_SECRET || auth !== `Bearer ${process.env.ADMIN_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { email, plan = 'enterprise', note } = await req.json()
    if (!email?.trim()) return NextResponse.json({ error: 'email is required' }, { status: 400 })

    const admin = getSupabaseAdmin()

    // Check if user exists
    const { data: existingUsers } = await admin.auth.admin.listUsers()
    const existing = existingUsers?.users.find(u => u.email === email.trim().toLowerCase())

    let userId: string

    if (existing) {
      userId = existing.id
    } else {
      // Invite new user, sends magic link to their email
      const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email.trim().toLowerCase(), {
        data: { invited_for: 'sandbox', note: note ?? 'Partner sandbox account' },
      })
      if (inviteErr || !invited?.user) {
        return NextResponse.json({ error: inviteErr?.message ?? 'Failed to invite user' }, { status: 500 })
      }
      userId = invited.user.id
    }

    // Upsert profile to enterprise plan. subscription_status='active'
    // suppresses the "Payment issue" warning in the dashboard sidebar; the
    // rest of the codebase reads subscription_status, not is_active (which
    // doesn't exist on the profiles table).
    const { error: profileErr } = await admin
      .from('profiles')
      .upsert(
        {
          id: userId,
          email: email.trim().toLowerCase(),
          plan,
          systems_limit: ENTERPRISE_LIMIT,
          subscription_status: 'active',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )

    if (profileErr) return NextResponse.json({ error: profileErr.message }, { status: 500 })

    return NextResponse.json({
      ok: true,
      user_id: userId,
      email: email.trim().toLowerCase(),
      plan,
      is_new: !existing,
    })
  } catch (err) {
    await logError(err, { route: 'POST /api/admin/provision' })
    return NextResponse.json({ error: 'Provisioning failed.' }, { status: 500 })
  }
}
