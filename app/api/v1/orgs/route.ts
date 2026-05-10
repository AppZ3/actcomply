// GET /api/v1/orgs — list organisations the calling key has access to
// (owner or active member). Use the `id` field in returned rows as the
// `org_id` parameter for other v1 endpoints.

import { NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { logError } from '@/lib/error-logger'
import { resolveApiKey, preflight, jsonWithCors, unauthorized } from '@/lib/api-v1'

export async function OPTIONS() {
  return preflight()
}

export async function GET(req: NextRequest) {
  const caller = await resolveApiKey(req)
  if (!caller) return unauthorized()

  try {
    const admin = getSupabaseAdmin()
    const [ownedRes, memberRes] = await Promise.all([
      admin.from('organizations')
        .select('id, name, created_at')
        .eq('owner_id', caller.userId)
        .order('created_at', { ascending: false }),
      admin.from('org_members')
        .select('org_id, role')
        .eq('user_id', caller.userId)
        .eq('status', 'active'),
    ])

    type OrgRow = { id: string; name: string; created_at: string }
    const owned: Array<OrgRow & { role: 'owner' }> = (ownedRes.data ?? []).map(o => ({
      ...(o as OrgRow), role: 'owner' as const,
    }))

    const memberOrgIds = (memberRes.data ?? []).map(r => r.org_id as string)
    let member: Array<OrgRow & { role: string }> = []
    if (memberOrgIds.length > 0) {
      const { data } = await admin
        .from('organizations')
        .select('id, name, created_at')
        .in('id', memberOrgIds)
        .order('created_at', { ascending: false })
      const roleByOrg = new Map(
        (memberRes.data ?? []).map(r => [r.org_id as string, r.role as string])
      )
      member = (data ?? []).map(o => ({ ...(o as OrgRow), role: roleByOrg.get(o.id) ?? 'member' }))
    }

    const seen = new Set<string>()
    const all = [...owned, ...member].filter(o => {
      if (seen.has(o.id)) return false
      seen.add(o.id)
      return true
    })

    return jsonWithCors({ data: all })
  } catch (err) {
    await logError(err, { route: 'GET /api/v1/orgs', userId: caller.userId })
    return jsonWithCors({ error: 'Failed to list organisations.' }, { status: 500 })
  }
}
