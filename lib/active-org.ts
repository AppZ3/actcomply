// Active organisation cookie + org-list helpers.
// The active org cookie is the server-side single source of truth for "which
// workspace am I currently looking at." Server Components and API routes read
// it directly via getActiveOrgId(). The cookie is set by a Server Action
// defined in the dashboard layout.
//
// org_id IS NULL ↔ personal workspace (the user's own assessments before
// multi-entity, plus any new assessments created without an active org).

import { cookies } from 'next/headers'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const ACTIVE_ORG_COOKIE = 'actcomply_active_org'

export async function getActiveOrgId(): Promise<string | null> {
  const store = await cookies()
  const value = store.get(ACTIVE_ORG_COOKIE)?.value
  return value && value.length > 0 ? value : null
}

export type OrgSummary = { id: string; name: string }

// Returns every org the user can switch into — both owned and member-of.
// Deduplicated, newest first. Service-role client because RLS would force a
// per-table join we don't need here.
export async function getUserOrgs(userId: string): Promise<OrgSummary[]> {
  const admin = getSupabaseAdmin()

  const [ownedRes, memberRes] = await Promise.all([
    admin.from('organizations').select('id, name, created_at').eq('owner_id', userId),
    admin.from('org_members').select('org_id').eq('user_id', userId).eq('status', 'active'),
  ])

  type Row = { id: string; name: string; created_at: string }
  const owned: Row[] = (ownedRes.data ?? []) as Row[]
  const memberOrgIds = (memberRes.data ?? []).map(r => r.org_id as string)

  let member: Row[] = []
  if (memberOrgIds.length > 0) {
    const { data } = await admin
      .from('organizations')
      .select('id, name, created_at')
      .in('id', memberOrgIds)
    member = (data ?? []) as Row[]
  }

  const seen = new Set<string>()
  return [...owned, ...member]
    .filter(o => {
      if (seen.has(o.id)) return false
      seen.add(o.id)
      return true
    })
    .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
    .map(o => ({ id: o.id, name: o.name }))
}
