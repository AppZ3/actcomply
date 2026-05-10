// GET /api/v1/assessments — list assessments visible to the calling key.
// Auth: Authorization: Bearer ac_<key>
//
// Query params:
//   org_id  — filter to a specific organisation (caller must have access).
//             Pass `personal` for the personal-workspace branch (org_id IS NULL).
//             Omit to return everything the key owner can see across all
//             personal + accessible orgs.
//   limit   — default 50, max 200
//   offset  — for pagination

import { NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { logError } from '@/lib/error-logger'
import {
  resolveApiKey, callerHasOrgAccess,
  preflight, jsonWithCors, unauthorized, forbidden,
} from '@/lib/api-v1'

export async function OPTIONS() {
  return preflight()
}

export async function GET(req: NextRequest) {
  const caller = await resolveApiKey(req)
  if (!caller) return unauthorized()

  try {
    const { searchParams } = new URL(req.url)
    const orgParam = searchParams.get('org_id')
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') ?? '50', 10), 1), 200)
    const offset = Math.max(parseInt(searchParams.get('offset') ?? '0', 10), 0)

    const admin = getSupabaseAdmin()
    let query = admin
      .from('assessments')
      .select('id, name, sector, risk_level, compliance_score, immediate_actions, org_id, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (orgParam === 'personal') {
      query = query.is('org_id', null).eq('user_id', caller.userId)
    } else if (orgParam) {
      if (!(await callerHasOrgAccess(caller, orgParam))) {
        return forbidden(`You do not have access to org_id ${orgParam}.`)
      }
      query = query.eq('org_id', orgParam)
    } else {
      // Combined view: personal + every accessible org. Need to resolve
      // accessible org ids first since the SDK doesn't easily express
      // (org_id IN orgs OR (org_id IS NULL AND user_id = caller)).
      const [ownedRes, memberRes] = await Promise.all([
        admin.from('organizations').select('id').eq('owner_id', caller.userId),
        admin.from('org_members').select('org_id').eq('user_id', caller.userId).eq('status', 'active'),
      ])
      const orgIds = [
        ...(ownedRes.data ?? []).map(o => o.id as string),
        ...(memberRes.data ?? []).map(r => r.org_id as string),
      ]
      // Dedupe.
      const uniqueOrgIds = Array.from(new Set(orgIds))
      // Build an `or` filter spanning personal + all org ids.
      const personalClause = `and(org_id.is.null,user_id.eq.${caller.userId})`
      const orgClause = uniqueOrgIds.length > 0 ? `org_id.in.(${uniqueOrgIds.join(',')})` : null
      const orFilter = orgClause ? `${personalClause},${orgClause}` : personalClause
      query = query.or(orFilter)
    }

    const { data, count, error } = await query
    if (error) throw error

    return jsonWithCors({
      data: data ?? [],
      pagination: { limit, offset, total: count ?? 0 },
    })
  } catch (err) {
    await logError(err, { route: 'GET /api/v1/assessments', userId: caller.userId })
    return jsonWithCors({ error: 'Failed to list assessments.' }, { status: 500 })
  }
}
