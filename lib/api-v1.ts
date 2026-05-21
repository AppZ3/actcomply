// Shared helpers for /api/v1/* public API routes.
// Centralised here so every v1 endpoint authenticates the same way and
// emits the same CORS headers. If you change auth or origin policy, change
// it here.

import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export type ApiCaller = { userId: string; keyId: string }

// Defense-in-depth: anywhere a UUID-typed string is about to be interpolated
// into a PostgREST filter expression (.or(), .in(), .eq() values inside a
// composed string), validate the shape first. Reject non-UUIDs before any
// DB call to make filter-injection impossible even if a future caller
// loosens upstream checks.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value)
}

// Resolve a Bearer ac_… token to its owning user. Bumps last_used_at as
// a side effect so customers see when their key was last touched.
export async function resolveApiKey(req: NextRequest): Promise<ApiCaller | null> {
  const auth = req.headers.get('authorization') ?? ''
  const raw = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  if (!raw.startsWith('ac_')) return null

  const keyHash = createHash('sha256').update(raw).digest('hex')
  const admin = getSupabaseAdmin()

  const { data } = await admin
    .from('api_keys')
    .select('id, user_id')
    .eq('key_hash', keyHash)
    .single()

  if (!data) return null

  // Best-effort touch, do not block on failure.
  admin.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', data.id)
    .then(() => {}, () => {})

  return { userId: data.user_id, keyId: data.id }
}

// Verify the calling api-key owner has access to the given org (owner
// or active member). Returns true for null org_id (personal workspace
// is always the caller's own).
export async function callerHasOrgAccess(caller: ApiCaller, orgId: string | null): Promise<boolean> {
  if (!orgId) return true
  const admin = getSupabaseAdmin()
  const [ownedRes, memberRes] = await Promise.all([
    admin.from('organizations').select('id').eq('id', orgId).eq('owner_id', caller.userId).maybeSingle(),
    admin.from('org_members').select('id').eq('org_id', orgId).eq('user_id', caller.userId).eq('status', 'active').maybeSingle(),
  ])
  return Boolean(ownedRes.data || memberRes.data)
}

// CORS, bearer-auth-protected API, so a permissive Allow-Origin is safe.
// In-browser fetch from any origin works as long as the caller has a key.
export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Max-Age': '86400',
} as const

export function preflight() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

// Wrap a NextResponse JSON body with CORS headers + standard error shape.
export function jsonWithCors(body: unknown, init?: { status?: number }) {
  return NextResponse.json(body, {
    status: init?.status ?? 200,
    headers: CORS_HEADERS,
  })
}

export function unauthorized() {
  return jsonWithCors({ error: 'Invalid or missing API key.' }, { status: 401 })
}

export function forbidden(detail = 'You do not have access to this resource.') {
  return jsonWithCors({ error: detail }, { status: 403 })
}
