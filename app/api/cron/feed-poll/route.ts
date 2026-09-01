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

/**
 * PostgREST reports an absent table as PGRST205, Postgres as 42P01. That is a
 * deployment state, not a runtime fault, and it must never page anyone.
 */
function isMissingTable(err: { code?: string | null; message?: string } | null): boolean {
  if (!err) return false
  return err.code === 'PGRST205' || err.code === '42P01' || /schema cache/i.test(err.message ?? '')
}

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

  // Probe once before doing any work. Without this the run polls all thirteen
  // sources, fails all thirteen writes, and logError sends two emails each.
  const probe = await admin.from('feed_items').select('id').limit(1)
  if (isMissingTable(probe.error)) {
    return NextResponse.json({
      skipped: true,
      migration_pending: 'supabase-migrations/add_newsletter_feed.sql',
      detail: 'feed_items does not exist yet, so there is nothing to poll into. Apply the migration and this starts working on the next run.',
    })
  }

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
        // Deliberately not logged here. Thirteen sources sharing one database
        // means one fault would otherwise raise thirteen alerts, and each
        // logError sends two emails. Summarised once below instead.
        return { key: source.key, ok: false, parsed: items.length, inserted: 0, note: `db: ${error.message}` }
      }

      return { key: source.key, ok: true, parsed: items.length, inserted: data?.length ?? 0 }
    })
  )

  const inserted = results.reduce((n, r) => n + r.inserted, 0)
  const failed = results.filter(r => !r.ok).map(r => `${r.key} (${r.note})`)

  // A publisher 403ing or serving HTML is normal weather and stays in the
  // response only. A database fault is worth exactly one alert.
  const dbFailures = results.filter(r => !r.ok && r.note?.startsWith('db: '))
  if (dbFailures.length > 0) {
    await logError(new Error(`feed-poll database writes failed: ${dbFailures[0].note}`), {
      route: 'cron-feed-poll',
      context: { failed_sources: dbFailures.map(r => r.key), total_sources: results.length },
    })
  }

  return NextResponse.json({
    inserted,
    sources_ok: results.filter(r => r.ok).length,
    sources_total: results.length,
    failed,
    detail: results,
  })
}
