export const maxDuration = 120

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { bearerOk } from '@/lib/auth-bearer'
import { logError } from '@/lib/error-logger'
import { FEED_SOURCES } from '@/lib/feed-sources'
import { parseFeed } from '@/lib/feed-parser'

/**
 * Retention window for ingest. Wider than a weekly digest needs, because the
 * most on-topic sources publish monthly and the composer selects from unused
 * items rather than only fresh ones.
 */
const MAX_AGE_DAYS = 40
const FETCH_TIMEOUT_MS = 15_000

// Some publishers reject unidentified server-side fetches.
const USER_AGENT = 'ActComplyFeedBot/1.0 (+https://www.getactcomply.com)'

interface SourceResult {
  key: string
  ok: boolean
  parsed: number
  inserted: number
  note?: string
}

/**
 * Polls every source in lib/feed-sources.ts and stores what is new.
 *
 * One bad source never fails the run. A feed that 403s, times out, or serves
 * an HTML error page is reported in its own row and the rest continue, because
 * the alternative is one flaky publisher silently stopping the newsletter.
 */
export async function GET(req: NextRequest) {
  if (!bearerOk(req.headers.get('authorization'), process.env.CRON_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = getSupabaseAdmin()
  const cutoff = Date.now() - MAX_AGE_DAYS * 86_400_000

  const results = await Promise.all(
    FEED_SOURCES.map(async (source): Promise<SourceResult> => {
      let xml: string
      try {
        const res = await fetch(source.url, {
          headers: { 'user-agent': USER_AGENT, accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml' },
          signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        })
        if (!res.ok) return { key: source.key, ok: false, parsed: 0, inserted: 0, note: `http ${res.status}` }
        xml = await res.text()
      } catch (err) {
        return { key: source.key, ok: false, parsed: 0, inserted: 0, note: `fetch failed: ${String(err).slice(0, 120)}` }
      }

      const items = parseFeed(xml)
      if (items.length === 0) {
        // Almost always a publisher serving HTML from a feed URL. Worth seeing
        // in the response rather than looking like a quiet week.
        return { key: source.key, ok: false, parsed: 0, inserted: 0, note: 'no items parsed, check the source URL' }
      }

      const fresh = items.filter(i => {
        if (!i.publishedAt) return false
        return new Date(i.publishedAt).getTime() >= cutoff
      })
      if (fresh.length === 0) return { key: source.key, ok: true, parsed: items.length, inserted: 0, note: 'nothing recent' }

      const { data, error } = await admin
        .from('feed_items')
        .upsert(
          fresh.map(i => ({
            source_key: source.key,
            guid: i.guid,
            url: i.url,
            title: i.title,
            summary: i.summary,
            published_at: i.publishedAt,
          })),
          { onConflict: 'source_key,guid', ignoreDuplicates: true }
        )
        .select('id')

      if (error) {
        await logError(error, { route: 'cron-feed-poll', context: { source: source.key } })
        return { key: source.key, ok: false, parsed: items.length, inserted: 0, note: `db: ${error.message}` }
      }

      return { key: source.key, ok: true, parsed: items.length, inserted: data?.length ?? 0 }
    })
  )

  const inserted = results.reduce((n, r) => n + r.inserted, 0)
  const failed = results.filter(r => !r.ok).map(r => `${r.key} (${r.note})`)

  return NextResponse.json({
    inserted,
    sources_ok: results.filter(r => r.ok).length,
    sources_total: results.length,
    failed,
    detail: results,
  })
}
