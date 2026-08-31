export const maxDuration = 300

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { bearerOk } from '@/lib/auth-bearer'
import { logError } from '@/lib/error-logger'
import { SEO_TOPICS } from '@/lib/seo-topics'
import { draftSeoPage } from '@/lib/seo-writer'

/**
 * Publishes one resource page per run, taking the first topic in
 * lib/seo-topics.ts that is not already in `seo_pages`.
 *
 * This replaces the "SEO Builder" claude.ai cloud routine, which had published
 * nothing since 1 August. That routine was asked to POST its pages from a
 * sandbox where WebFetch is read-only and egress to *.vercel.app is blocked, so
 * it could not have worked, and it carried the write token in its prompt as
 * plain text. Generating in-app removes the egress problem, the relay and the
 * shared secret in one go, and one page a day indexes better than ten a month.
 */
export async function GET(req: NextRequest) {
  if (!bearerOk(req.headers.get('authorization'), process.env.CRON_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = getSupabaseAdmin()

  const { data: existing, error: readError } = await admin.from('seo_pages').select('slug')
  if (readError) {
    logError(readError, { route: 'cron-seo-builder' })
    return NextResponse.json({ error: 'Could not read published pages' }, { status: 500 })
  }

  const publishedSlugs = (existing ?? []).map(r => r.slug as string)
  const published = new Set(publishedSlugs)
  const topic = SEO_TOPICS.find(t => !published.has(t.slug))

  if (!topic) {
    // Not an error. The backlog is a file, so the fix is a commit.
    return NextResponse.json({ published: null, reason: 'backlog empty', total: published.size })
  }

  try {
    const page = await draftSeoPage(topic, publishedSlugs)

    const { error: writeError } = await admin.from('seo_pages').upsert(
      {
        slug: page.slug,
        title: page.title,
        meta_description: page.meta_description,
        content: page.content,
        schema_markup: page.schema_markup,
        internal_links: page.internal_links,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'slug' }
    )
    if (writeError) throw writeError

    return NextResponse.json({
      published: page.slug,
      title: page.title,
      words: page.content.split(/\s+/).length,
      internal_links: page.internal_links,
      remaining: SEO_TOPICS.length - published.size - 1,
    })
  } catch (err) {
    logError(err, { route: 'cron-seo-builder', context: { slug: topic.slug } })
    return NextResponse.json({ error: 'Draft failed', slug: topic.slug }, { status: 500 })
  }
}
