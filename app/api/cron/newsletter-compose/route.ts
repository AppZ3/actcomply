export const maxDuration = 300

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getResend } from '@/lib/resend'
import { bearerOk } from '@/lib/auth-bearer'
import { logError } from '@/lib/error-logger'
import { bodyToHtml, newsletterShellHtml, escapeHtml } from '@/lib/newsletter'
import { scoreItems, composeIssue, selectCandidates, type CandidateItem, type ResourcePage } from '@/lib/newsletter-composer'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.getactcomply.com'
const REVIEW_TO = 'zaclowe@outlook.com.au'

/**
 * How far back to look. Wide, because used items are retired via used_in_issue
 * rather than aged out, and the best sources publish monthly. A 14 day window
 * excluded artificialintelligenceact.eu entirely.
 */
const WINDOW_DAYS = 35
const MAX_CANDIDATES = 60
/** Per source, so a daily publisher cannot crowd out a monthly one. */
const PER_SOURCE = 6

/** An item has to clear this to appear in an issue. */
const RELEVANCE_FLOOR = 60
const MAX_ITEMS = 5
/** Below this, there is no issue worth sending. */
const MIN_ITEMS = 2

/** Resource pages used in recent issues are skipped so the deeper read rotates. */
const RECENT_ISSUES_TO_CHECK = 8

/**
 * Composes the next newsletter issue as a DRAFT and emails it to Zac.
 *
 * It never sends to subscribers. Sending stays a deliberate act through
 * POST /api/newsletter/send, because the issue is assembled from third-party
 * feeds and goes out under Zac's own name.
 */
export async function GET(req: NextRequest) {
  if (!bearerOk(req.headers.get('authorization'), process.env.CRON_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = getSupabaseAdmin()

  try {
    // Same guard as feed-poll. Until the migration is applied there is nothing
    // to compose from, and that is a deployment state, not an error.
    const probe = await admin.from('feed_items').select('id').limit(1)
    if (probe.error && (probe.error.code === 'PGRST205' || probe.error.code === '42P01')) {
      return NextResponse.json({
        composed: false,
        migration_pending: 'supabase-migrations/add_newsletter_feed.sql',
        reason: 'feed_items does not exist yet',
      })
    }

    const since = new Date(Date.now() - WINDOW_DAYS * 86_400_000).toISOString()

    const { data: rows, error: readErr } = await admin
      .from('feed_items')
      .select('id, source_key, title, summary, url, published_at')
      .is('used_in_issue', null)
      .gte('published_at', since)
      .order('published_at', { ascending: false })
      .limit(300)
    if (readErr) throw readErr

    const candidates = selectCandidates((rows ?? []) as CandidateItem[], {
      perSource: PER_SOURCE,
      limit: MAX_CANDIDATES,
    })
    if (candidates.length === 0) {
      return NextResponse.json({ composed: false, reason: 'no unused feed items in window' })
    }

    const scored = await scoreItems(candidates)

    // Persist every score, including the rejects. Next week's run then only
    // pays to score genuinely new material.
    const now = new Date().toISOString()
    await Promise.all(
      scored.map(s =>
        admin
          .from('feed_items')
          .update({ relevance: s.relevance, why_it_matters: s.why_it_matters || null, scored_at: now })
          .eq('id', s.id)
      )
    )

    const selected = scored
      .filter(s => s.relevance >= RELEVANCE_FLOOR && s.why_it_matters)
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, MAX_ITEMS)

    if (selected.length < MIN_ITEMS) {
      // A quiet week is a real outcome. Say so instead of padding an issue.
      return NextResponse.json({
        composed: false,
        reason: `only ${selected.length} item(s) cleared relevance ${RELEVANCE_FLOOR}`,
        scored: scored.length,
        best: scored.sort((a, b) => b.relevance - a.relevance).slice(0, 3).map(s => ({ t: s.title, r: s.relevance })),
      })
    }

    // Pick the deeper read: the newest resource page not featured recently.
    const { data: recentIssues } = await admin
      .from('newsletter_issues')
      .select('body_md')
      .order('created_at', { ascending: false })
      .limit(RECENT_ISSUES_TO_CHECK)
    const recentBodies = (recentIssues ?? []).map(i => String(i.body_md ?? '')).join('\n')

    const { data: pages } = await admin
      .from('seo_pages')
      .select('slug, title, meta_description')
      .order('created_at', { ascending: false })
      .limit(40)
    const resource: ResourcePage | null =
      ((pages ?? []) as ResourcePage[]).find(p => !recentBodies.includes(`/resources/${p.slug}`)) ?? null

    const { count: issueCount } = await admin
      .from('newsletter_issues')
      .select('id', { count: 'exact', head: true })
    const issueNumber = (issueCount ?? 0) + 1

    const composed = await composeIssue({ items: selected, resource, issueNumber })

    const slug = `issue-${String(issueNumber).padStart(3, '0')}-${composed.subject
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60)}`

    const bodyHtml = bodyToHtml(composed.body)

    const { data: issue, error: insErr } = await admin
      .from('newsletter_issues')
      .insert({ slug, subject: composed.subject, body_md: composed.body, body_html: bodyHtml })
      .select('id')
      .single()
    if (insErr) throw insErr

    // Retire the items used, so they cannot appear in a later issue.
    await admin
      .from('feed_items')
      .update({ used_in_issue: issue.id })
      .in('id', selected.map(s => s.id))

    // Send Zac the draft exactly as a subscriber would see it, plus the notes
    // he needs to decide whether to send it.
    const preview = newsletterShellHtml({
      subject: composed.subject,
      bodyHtml,
      unsubscribeUrl: `${APP_URL}/api/newsletter/unsubscribe?token=PREVIEW`,
    })
    const notes = `
      <div style="max-width:640px;margin:0 auto;padding:0 16px 24px;font-family:-apple-system,sans-serif">
        <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:16px 20px">
          <p style="margin:0 0 8px;font-size:13px;color:#9a3412"><strong>Draft only. Nothing has been sent.</strong></p>
          <p style="margin:0 0 8px;font-size:13px;color:#7c2d12">Slug: <code>${slug}</code></p>
          <p style="margin:0 0 8px;font-size:13px;color:#7c2d12">Sources used: ${composed.items
            .map(i => `${i.relevance}, ${escapeHtml(i.title.slice(0, 70))}`)
            .join('<br>')}</p>
          <p style="margin:0;font-size:13px;color:#7c2d12">To send: POST ${APP_URL}/api/newsletter/send with the slug, subject and body, dryRun first.</p>
        </div>
      </div>`

    await getResend().emails.send({
      from: 'ActComply <alerts@getactcomply.com>',
      to: REVIEW_TO,
      replyTo: 'hello@getactcomply.com',
      subject: `Newsletter draft ready: ${composed.subject}`,
      html: preview + notes,
    })

    return NextResponse.json({
      composed: true,
      issue_id: issue.id,
      slug,
      subject: composed.subject,
      words: composed.body.split(/\s+/).length,
      items: composed.items.map(i => ({ title: i.title, relevance: i.relevance, url: i.url })),
      resource: composed.resourceSlug,
      scored: scored.length,
      sent_to_subscribers: false,
    })
  } catch (err) {
    await logError(err, { route: 'cron-newsletter-compose' })
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
