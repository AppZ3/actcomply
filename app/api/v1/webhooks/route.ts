// /api/v1/webhooks, manage outbound webhook subscriptions.
// GET   list , every endpoint owned by this api key (personal + accessible orgs)
// POST  create, { url, enabled_events: [...], description?, org_id? }

import { NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { logError } from '@/lib/error-logger'
import { newWebhookSecret } from '@/lib/webhooks'
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
    const admin = getSupabaseAdmin()
    // Caller's personal endpoints + any in orgs they own/are member of.
    const [ownedRes, memberRes] = await Promise.all([
      admin.from('organizations').select('id').eq('owner_id', caller.userId),
      admin.from('org_members').select('org_id').eq('user_id', caller.userId).eq('status', 'active'),
    ])
    const orgIds = Array.from(new Set([
      ...(ownedRes.data ?? []).map(o => o.id as string),
      ...(memberRes.data ?? []).map(r => r.org_id as string),
    ]))

    let q = admin
      .from('webhook_endpoints')
      .select('id, url, description, enabled_events, status, org_id, created_at, last_used_at')
      .order('created_at', { ascending: false })

    const personalClause = `and(org_id.is.null,user_id.eq.${caller.userId})`
    const orgClause = orgIds.length > 0 ? `org_id.in.(${orgIds.join(',')})` : null
    q = q.or(orgClause ? `${personalClause},${orgClause}` : personalClause)

    const { data, error } = await q
    if (error) throw error
    return jsonWithCors({ data: data ?? [] })
  } catch (err) {
    await logError(err, { route: 'GET /api/v1/webhooks', userId: caller.userId })
    return jsonWithCors({ error: 'Failed to list webhooks.' }, { status: 500 })
  }
}

const SUPPORTED_EVENTS = new Set([
  'assessment.created',
  'document.generated',
  'alert.published',
  'incident.created',
])

export async function POST(req: NextRequest) {
  const caller = await resolveApiKey(req)
  if (!caller) return unauthorized()

  try {
    const body = (await req.json()) as {
      url?: string
      description?: string
      enabled_events?: string[]
      org_id?: string | null
    }

    if (!body.url || !/^https?:\/\//.test(body.url)) {
      return jsonWithCors({ error: 'url must be a valid http(s) URL.' }, { status: 400 })
    }
    if (!Array.isArray(body.enabled_events) || body.enabled_events.length === 0) {
      return jsonWithCors({ error: 'enabled_events must be a non-empty array.' }, { status: 400 })
    }
    const unknown = body.enabled_events.filter(e => !SUPPORTED_EVENTS.has(e))
    if (unknown.length > 0) {
      return jsonWithCors({
        error: `Unknown event types: ${unknown.join(', ')}`,
        supported: Array.from(SUPPORTED_EVENTS),
      }, { status: 400 })
    }

    const orgId = body.org_id ?? null
    if (orgId && !(await callerHasOrgAccess(caller, orgId))) {
      return forbidden(`You do not have access to org_id ${orgId}.`)
    }

    const secret = newWebhookSecret()
    const admin = getSupabaseAdmin()
    const { data, error } = await admin
      .from('webhook_endpoints')
      .insert({
        user_id: caller.userId,
        org_id: orgId,
        url: body.url,
        description: body.description ?? '',
        secret,
        enabled_events: body.enabled_events,
      })
      .select('id, url, description, enabled_events, status, org_id, created_at')
      .single()

    if (error) throw error

    // Return secret ONCE on creation, the receiver needs it to verify
    // signatures. After this it's never returned via API.
    return jsonWithCors({
      ...data,
      secret,
      verification: {
        header: 'X-ActComply-Signature',
        algorithm: 'HMAC-SHA256',
        body_format: 'raw request body string',
      },
    }, { status: 201 })
  } catch (err) {
    await logError(err, { route: 'POST /api/v1/webhooks', userId: caller.userId })
    return jsonWithCors({ error: 'Failed to create webhook.' }, { status: 500 })
  }
}
