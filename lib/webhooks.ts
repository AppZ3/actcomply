// Outbound webhook delivery.
//
// Design: fire-and-forget from the API route after the trigger event
// completes. We POST JSON with an X-ActComply-Signature header (HMAC-SHA256
// over the raw body) so receivers can verify authenticity. Each attempt is
// logged in webhook_deliveries for audit + retry visibility.
//
// V1 is single-shot: if the target returns non-2xx, we record the failure
// but do NOT retry inline (to avoid blocking the API response). A future
// cron job can scan failed/pending rows and retry with backoff.

import { createHmac, randomBytes } from 'crypto'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export type WebhookEventType =
  | 'assessment.created'
  | 'document.generated'
  | 'alert.published'
  | 'incident.created'

export function newWebhookSecret(): string {
  return randomBytes(32).toString('hex')
}

export function signPayload(secret: string, body: string): string {
  return createHmac('sha256', secret).update(body).digest('hex')
}

// Verify signature (exposed for receivers; not used internally).
export function verifySignature(secret: string, body: string, signature: string): boolean {
  const expected = signPayload(secret, body)
  // constant-time compare via Buffer.compare on equal-length buffers
  if (signature.length !== expected.length) return false
  return Buffer.from(signature).equals(Buffer.from(expected))
}

// Look up every enabled endpoint subscribed to an event for the given owner
// (user + optional org). Used by trigger sites.
export async function findSubscribedEndpoints(
  ownerUserId: string,
  orgId: string | null,
  event: WebhookEventType
): Promise<Array<{ id: string; url: string; secret: string }>> {
  const admin = getSupabaseAdmin()
  let q = admin
    .from('webhook_endpoints')
    .select('id, url, secret, enabled_events')
    .eq('status', 'enabled')

  q = orgId
    ? q.or(`org_id.eq.${orgId},and(org_id.is.null,user_id.eq.${ownerUserId})`)
    : q.is('org_id', null).eq('user_id', ownerUserId)

  const { data } = await q
  return (data ?? [])
    .filter(e => Array.isArray(e.enabled_events) && e.enabled_events.includes(event))
    .map(e => ({ id: e.id as string, url: e.url as string, secret: e.secret as string }))
}

// POST the payload to the target URL with signature + log the attempt.
// Returns when delivery completes (success or failure) so the caller can
// await Promise.all([...]) on multiple deliveries in parallel.
export async function deliverWebhook(opts: {
  endpointId: string
  url: string
  secret: string
  event: WebhookEventType
  payload: Record<string, unknown>
}): Promise<void> {
  const admin = getSupabaseAdmin()
  const eventId = crypto.randomUUID()
  const body = JSON.stringify({
    id: eventId,
    type: opts.event,
    created_at: new Date().toISOString(),
    data: opts.payload,
  })
  const signature = signPayload(opts.secret, body)

  let response_status: number | null = null
  let response_body: string | null = null
  let status: 'delivered' | 'failed' = 'failed'
  let delivered_at: string | null = null

  try {
    const res = await fetch(opts.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ActComply-Webhooks/1.0',
        'X-ActComply-Event': opts.event,
        'X-ActComply-Event-Id': eventId,
        'X-ActComply-Signature': signature,
      },
      body,
      signal: AbortSignal.timeout(15_000), // 15s ceiling, fail fast
    })
    response_status = res.status
    // Capture only the first 4 KB of the response body for audit.
    response_body = (await res.text()).slice(0, 4096)
    if (res.ok) {
      status = 'delivered'
      delivered_at = new Date().toISOString()
    }
  } catch (err) {
    response_body = err instanceof Error ? err.message.slice(0, 4096) : String(err).slice(0, 4096)
  }

  await admin.from('webhook_deliveries').insert({
    endpoint_id: opts.endpointId,
    event_type: opts.event,
    event_id: eventId,
    payload: opts.payload,
    response_status,
    response_body,
    attempts: 1,
    status,
    delivered_at,
  })

  if (status === 'delivered') {
    admin.from('webhook_endpoints').update({ last_used_at: new Date().toISOString() })
      .eq('id', opts.endpointId).then(() => {}, () => {})
  }
}

// Convenience: fan out a single event to every subscribed endpoint.
// Awaits all in parallel; total time is bounded by the slowest endpoint
// (~15s ceiling each).
export async function emitEvent(opts: {
  ownerUserId: string
  orgId: string | null
  event: WebhookEventType
  payload: Record<string, unknown>
}): Promise<void> {
  const targets = await findSubscribedEndpoints(opts.ownerUserId, opts.orgId, opts.event)
  if (targets.length === 0) return
  await Promise.all(
    targets.map(t =>
      deliverWebhook({
        endpointId: t.id,
        url: t.url,
        secret: t.secret,
        event: opts.event,
        payload: opts.payload,
      })
    )
  )
}
