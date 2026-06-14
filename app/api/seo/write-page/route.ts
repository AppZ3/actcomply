export const maxDuration = 30

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { bearerOk } from '@/lib/auth-bearer'
import { logError } from '@/lib/error-logger'

interface SeoPageInput {
  slug: string
  title: string
  meta_description?: string
  content: string
  schema_markup?: Record<string, unknown>
  internal_links?: string[]
}

export async function POST(req: NextRequest) {
  if (!bearerOk(req.headers.get('authorization'), process.env.CRON_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: SeoPageInput
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.slug || !body.title || !body.content) {
    return NextResponse.json({ error: 'Missing required fields: slug, title, content' }, { status: 400 })
  }

  const slug = body.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')

  try {
    const db = getSupabaseAdmin()
    const { error } = await db.from('seo_pages').upsert(
      {
        slug,
        title: body.title,
        meta_description: body.meta_description ?? null,
        content: body.content,
        schema_markup: body.schema_markup ?? null,
        internal_links: body.internal_links ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'slug' }
    )
    if (error) throw error
    return NextResponse.json({ ok: true, slug })
  } catch (err) {
    logError(err, { route: 'seo-write-page', slug })
    return NextResponse.json({ error: 'Write failed' }, { status: 500 })
  }
}
