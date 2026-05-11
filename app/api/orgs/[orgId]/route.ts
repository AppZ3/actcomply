// PATCH /api/orgs/[orgId], update org metadata (name, branding).
// Only the owner can patch these fields.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { logError } from '@/lib/error-logger'

type PatchBody = {
  name?: string
  brand_name?: string | null
  logo_url?: string | null
  brand_color?: string | null
}

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = (await req.json()) as PatchBody

    const admin = getSupabaseAdmin()
    const { data: org } = await admin
      .from('organizations')
      .select('id, owner_id')
      .eq('id', orgId)
      .single()
    if (!org) return NextResponse.json({ error: 'Organisation not found' }, { status: 404 })
    if (org.owner_id !== user.id) {
      return NextResponse.json({ error: 'Only the org owner can update branding.' }, { status: 403 })
    }

    const update: Record<string, unknown> = {}
    if (typeof body.name === 'string' && body.name.trim()) update.name = body.name.trim()
    if (body.brand_name !== undefined) update.brand_name = body.brand_name?.trim() || null
    if (body.logo_url !== undefined) {
      const trimmed = body.logo_url?.trim() || null
      if (trimmed && !/^https:\/\//i.test(trimmed)) {
        return NextResponse.json({ error: 'logo_url must be an https:// URL.' }, { status: 400 })
      }
      update.logo_url = trimmed
    }
    if (body.brand_color !== undefined) {
      const trimmed = body.brand_color?.trim() || null
      if (trimmed && !HEX_COLOR.test(trimmed)) {
        return NextResponse.json({ error: 'brand_color must be a hex colour like #0f172a.' }, { status: 400 })
      }
      update.brand_color = trimmed
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No fields to update.' }, { status: 400 })
    }

    const { data, error } = await admin
      .from('organizations')
      .update(update)
      .eq('id', orgId)
      .select('id, name, brand_name, logo_url, brand_color')
      .single()
    if (error) throw error

    return NextResponse.json(data)
  } catch (err) {
    await logError(err, { route: 'PATCH /api/orgs/[orgId]', userId: user.id, context: { orgId } })
    return NextResponse.json({ error: 'Failed to update organisation.' }, { status: 500 })
  }
}
