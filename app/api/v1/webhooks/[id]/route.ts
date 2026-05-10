// /api/v1/webhooks/[id]
// GET    read endpoint + last 20 deliveries
// DELETE remove endpoint

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

async function loadEndpointAndAuthorize(id: string, callerUserId: string) {
  const admin = getSupabaseAdmin()
  const { data } = await admin
    .from('webhook_endpoints')
    .select('id, user_id, org_id, url, description, enabled_events, status, created_at, last_used_at')
    .eq('id', id)
    .maybeSingle()
  if (!data) return { ok: false as const, status: 404 as const }

  if (data.user_id === callerUserId) return { ok: true as const, endpoint: data }
  if (data.org_id) {
    const ok = await callerHasOrgAccess({ userId: callerUserId, keyId: '' }, data.org_id as string)
    if (ok) return { ok: true as const, endpoint: data }
  }
  return { ok: false as const, status: 403 as const }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const caller = await resolveApiKey(req)
  if (!caller) return unauthorized()
  const { id } = await params

  try {
    const result = await loadEndpointAndAuthorize(id, caller.userId)
    if (!result.ok) {
      return result.status === 404
        ? jsonWithCors({ error: 'Webhook not found.' }, { status: 404 })
        : forbidden()
    }

    const admin = getSupabaseAdmin()
    const { data: deliveries } = await admin
      .from('webhook_deliveries')
      .select('id, event_type, event_id, response_status, status, attempts, created_at, delivered_at')
      .eq('endpoint_id', id)
      .order('created_at', { ascending: false })
      .limit(20)

    return jsonWithCors({ endpoint: result.endpoint, recent_deliveries: deliveries ?? [] })
  } catch (err) {
    await logError(err, { route: 'GET /api/v1/webhooks/[id]', userId: caller.userId, context: { id } })
    return jsonWithCors({ error: 'Failed to read webhook.' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const caller = await resolveApiKey(req)
  if (!caller) return unauthorized()
  const { id } = await params

  try {
    const result = await loadEndpointAndAuthorize(id, caller.userId)
    if (!result.ok) {
      return result.status === 404
        ? jsonWithCors({ error: 'Webhook not found.' }, { status: 404 })
        : forbidden()
    }

    const admin = getSupabaseAdmin()
    const { error } = await admin.from('webhook_endpoints').delete().eq('id', id)
    if (error) throw error
    return jsonWithCors({ ok: true })
  } catch (err) {
    await logError(err, { route: 'DELETE /api/v1/webhooks/[id]', userId: caller.userId, context: { id } })
    return jsonWithCors({ error: 'Failed to delete webhook.' }, { status: 500 })
  }
}
