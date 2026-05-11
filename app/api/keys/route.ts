// GET  /api/keys, list API keys for authenticated user
// POST /api/keys, create a new API key (Enterprise only)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getPlanFeatures } from '@/lib/stripe'
import { randomBytes, createHash } from 'crypto'
import { logError } from '@/lib/error-logger'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const admin = getSupabaseAdmin()
    const { data, error } = await admin
      .from('api_keys')
      .select('id, name, key_prefix, last_used_at, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  } catch (err) {
    await logError(err, { route: 'GET /api/keys', userId: user.id, userEmail: user.email })
    return NextResponse.json({ error: 'Failed to fetch API keys.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
    const features = getPlanFeatures(profile?.plan)
    if (!features.apiAccess) {
      return NextResponse.json({ error: 'API access requires an Enterprise plan.' }, { status: 403 })
    }

    const body = await req.json()
    const name = (body.name ?? '').trim()
    if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

    const rawKey = `ac_${randomBytes(32).toString('hex')}`
    const keyHash = createHash('sha256').update(rawKey).digest('hex')
    const keyPrefix = rawKey.slice(0, 10)

    const admin = getSupabaseAdmin()
    const { data, error } = await admin
      .from('api_keys')
      .insert({ user_id: user.id, name, key_hash: keyHash, key_prefix: keyPrefix })
      .select('id, name, key_prefix, created_at')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ...data, raw_key: rawKey })
  } catch (err) {
    await logError(err, { route: 'POST /api/keys', userId: user.id, userEmail: user.email })
    return NextResponse.json({ error: 'Failed to create API key.' }, { status: 500 })
  }
}
