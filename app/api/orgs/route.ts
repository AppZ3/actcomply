// GET  /api/orgs — list orgs for authenticated user
// POST /api/orgs — create a new org (Enterprise only)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getPlanFeatures } from '@/lib/stripe'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const admin = getSupabaseAdmin()

    // Orgs where user is owner or active member
    const { data: ownedOrgs } = await admin
      .from('organizations')
      .select('*, org_members(id, email, role, status)')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })

    const { data: memberRows } = await admin
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .eq('status', 'active')

    const memberOrgIds = (memberRows ?? []).map(r => r.org_id)

    let memberOrgs: typeof ownedOrgs = []
    if (memberOrgIds.length > 0) {
      const { data } = await admin
        .from('organizations')
        .select('*, org_members(id, email, role, status)')
        .in('id', memberOrgIds)
        .order('created_at', { ascending: false })
      memberOrgs = data ?? []
    }

    // Merge, deduplicate by id, preserve created_at order
    const seen = new Set<string>()
    const all = [...(ownedOrgs ?? []), ...memberOrgs].filter(o => {
      if (seen.has(o.id)) return false
      seen.add(o.id)
      return true
    })

    return NextResponse.json(all)
  } catch (err) {
    console.error('Orgs fetch error:', err instanceof Error ? err.stack : String(err))
    return NextResponse.json({ error: 'Failed to fetch organisations.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
    if (!getPlanFeatures(profile?.plan).multiEntity) {
      return NextResponse.json({ error: 'Multi-entity management requires an Enterprise plan.' }, { status: 403 })
    }

    const { name } = await req.json()
    if (!name?.trim()) return NextResponse.json({ error: 'name is required' }, { status: 400 })

    const admin = getSupabaseAdmin()
    const { data, error } = await admin
      .from('organizations')
      .insert({ owner_id: user.id, name: name.trim() })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err) {
    console.error('Org create error:', err instanceof Error ? err.stack : String(err))
    return NextResponse.json({ error: 'Failed to create organisation.' }, { status: 500 })
  }
}
