import Anthropic from '@anthropic-ai/sdk'
import { withRetry } from './anthropic'
import { getEnforcementStatus } from './eu-ai-act'
import { FEED_SOURCES } from './feed-sources'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface CandidateItem {
  id: string
  source_key: string
  title: string
  summary: string | null
  url: string
  published_at: string | null
}

export interface ScoredItem extends CandidateItem {
  relevance: number
  why_it_matters: string
}

export interface ResourcePage {
  slug: string
  title: string
  meta_description: string | null
}

export interface ComposedIssue {
  subject: string
  body: string
  items: ScoredItem[]
  resourceSlug: string | null
}

const TIER_BY_KEY = new Map(FEED_SOURCES.map(s => [s.key, s.tier]))

/**
 * Choose what to put in front of the scorer.
 *
 * Ranking the window purely by recency starves the newsletter of its best
 * material. artificialintelligenceact.eu, the most on-topic source there is,
 * publishes roughly monthly, while Politico, WIRED, Ars and MIT publish daily.
 * Sorting by date and taking the top N hands every slot to the high-volume
 * general press and drops the tier 1 sources entirely.
 *
 * So: cap each source, then order by tier before date. A quiet authoritative
 * source keeps its place at the table.
 */
export function selectCandidates(
  rows: CandidateItem[],
  { perSource = 6, limit = 60 }: { perSource?: number; limit?: number } = {}
): CandidateItem[] {
  const byDateDesc = [...rows].sort((a, b) => (b.published_at ?? '').localeCompare(a.published_at ?? ''))

  const counts = new Map<string, number>()
  const capped: CandidateItem[] = []
  for (const r of byDateDesc) {
    const n = counts.get(r.source_key) ?? 0
    if (n >= perSource) continue
    counts.set(r.source_key, n + 1)
    capped.push(r)
  }

  return capped
    .sort((a, b) => {
      const ta = TIER_BY_KEY.get(a.source_key) ?? 3
      const tb = TIER_BY_KEY.get(b.source_key) ?? 3
      if (ta !== tb) return ta - tb
      return (b.published_at ?? '').localeCompare(a.published_at ?? '')
    })
    .slice(0, limit)
}

const NAME_BY_KEY = new Map(FEED_SOURCES.map(s => [s.key, s.name]))

function timelineBlock(): string {
  const e = getEnforcementStatus()
  return `- 2 February 2025: Article 5 prohibitions applied.
- 2 August 2026: enforcement powers went live. This date has PASSED. Article 53 GPAI obligations and Article 50 transparency are enforceable today. Never describe it as upcoming.
- 2 December 2027: Annex III standalone high-risk obligations apply. This is the next hard date${e.daysUntilNext ? `, ${e.daysUntilNext} days away` : ''}.
- 2 August 2028: Annex I embedded high-risk obligations apply.`
}

function parseJson(raw: string): unknown {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/, '')
    .trim()
  return JSON.parse(cleaned)
}

/**
 * Score candidates for relevance to an EU AI Act newsletter aimed at people
 * shipping AI products.
 *
 * Tier is passed through so general tech press has to clear a higher bar than
 * a source that is on-topic by definition. Anything the model does not return
 * a score for is treated as scored zero, not silently kept.
 */
export async function scoreItems(candidates: CandidateItem[]): Promise<ScoredItem[]> {
  if (candidates.length === 0) return []

  const list = candidates
    .map((c, i) => {
      const tier = TIER_BY_KEY.get(c.source_key) ?? 3
      return `[${i}] tier=${tier} source=${NAME_BY_KEY.get(c.source_key) ?? c.source_key}
title: ${c.title}
summary: ${(c.summary ?? '').slice(0, 400)}`
    })
    .join('\n\n')

  const message = await withRetry(() =>
    client.messages.create({
      model: 'claude-opus-5',
      max_tokens: 16000,
      thinking: { type: 'adaptive' },
      system: `You triage news for a newsletter about the EU AI Act, read by CTOs, founders and heads of product at EU companies of 20 to 500 people that ship AI products. They are technical, not lawyers. They want to know what applies to them and what to do.

TIMELINE
${timelineBlock()}

SCORING, 0 to 100
- 85 to 100: changes what a reader must actually do. New AI Office guidance, an enforcement action, a national authority designation, a standard being published, a court ruling on the Act.
- 60 to 84: real and worth knowing. Omnibus progress, a substantive analysis of an obligation, a Member State implementation step.
- 30 to 59: adjacent. General AI policy, privacy enforcement that is not AI Act, EU digital regulation generally.
- 0 to 29: not relevant. Product launches, funding rounds, US-only policy, general AI commentary, anything where the EU AI Act connection is decorative.

Tier 1 sources are on-topic by definition. Tier 3 is general tech and policy press where most items are irrelevant, so an item from tier 3 needs to be clearly about AI regulation to score above 40. Do not inflate a score because a headline mentions AI.

Be strict. A thin week that yields two good items is a better newsletter than a padded week of five weak ones.

For every item return a "why_it_matters": one sentence, plain English, addressed to someone shipping an AI product, saying what this means for them. No marketing language. No em dashes. British spelling.

Return only a JSON array, no prose, no markdown fence:
[{"index": 0, "relevance": 78, "why_it_matters": "..."}]
Include every index exactly once.`,
      messages: [{ role: 'user', content: `Score these ${candidates.length} items.\n\n${list}` }],
    })
  )

  const text = message.content.find(b => b.type === 'text')
  if (!text || text.type !== 'text') throw new Error('Claude returned no text block when scoring')

  const parsed = parseJson(text.text)
  if (!Array.isArray(parsed)) throw new Error('Scoring did not return an array')

  const byIndex = new Map<number, { relevance: number; why: string }>()
  for (const row of parsed) {
    if (!row || typeof row !== 'object') continue
    const r = row as Record<string, unknown>
    const idx = typeof r.index === 'number' ? r.index : Number(r.index)
    const rel = typeof r.relevance === 'number' ? r.relevance : Number(r.relevance)
    if (!Number.isInteger(idx) || idx < 0 || idx >= candidates.length) continue
    if (!Number.isFinite(rel)) continue
    byIndex.set(idx, {
      relevance: Math.max(0, Math.min(100, Math.round(rel))),
      why: typeof r.why_it_matters === 'string' ? r.why_it_matters.trim() : '',
    })
  }

  return candidates.map((c, i) => {
    const hit = byIndex.get(i)
    return { ...c, relevance: hit?.relevance ?? 0, why_it_matters: hit?.why ?? '' }
  })
}

/**
 * Write the issue.
 *
 * The body is plain text with blank lines between paragraphs, which is what
 * bodyToHtml in lib/newsletter.ts expects. Links are written as markdown so
 * that renderer can turn them into anchors.
 */
export async function composeIssue({
  items,
  resource,
  issueNumber,
}: {
  items: ScoredItem[]
  resource: ResourcePage | null
  issueNumber: number
}): Promise<ComposedIssue> {
  if (items.length === 0) throw new Error('Nothing to compose, no items cleared the relevance bar')

  const itemBlock = items
    .map(
      (it, i) => `${i + 1}. ${it.title}
   source: ${NAME_BY_KEY.get(it.source_key) ?? it.source_key}
   url: ${it.url}
   relevance: ${it.relevance}
   why it matters: ${it.why_it_matters}
   summary: ${(it.summary ?? '').slice(0, 500)}`
    )
    .join('\n\n')

  const resourceBlock = resource
    ? `slug: ${resource.slug}
title: ${resource.title}
description: ${resource.meta_description ?? ''}
url: https://www.getactcomply.com/resources/${resource.slug}`
    : 'None available. Omit the "Worth a longer read" section entirely.'

  const message = await withRetry(() =>
    client.messages.create({
      model: 'claude-opus-5',
      max_tokens: 16000,
      thinking: { type: 'adaptive' },
      system: `You write "Builder's Notes on the EU AI Act", a newsletter by Zac Lowe, who is building ActComply. Readers are CTOs, founders and heads of product at EU companies of 20 to 500 people shipping AI products. Technical, not lawyers.

TIMELINE
${timelineBlock()}
Write in the tense this implies. Enforcement is happening, not approaching.

VOICE
- Counter-narrative opener that inverts the prevailing assumption. Never open with "This week in AI regulation".
- Short declarative sentences. No hedging.
- Article and Annex specificity. Ground claims in the regulation.
- Write as the person building the answer, not summarising the news.
- Concrete over abstract. "HR software that scores candidates", not "regulated decisioning systems".

HARD RULES
- NEVER an em dash or en dash. Use a comma, a full stop, or restructure. Absolute.
- NEVER emoji.
- British spelling.
- Never invent a fact, a figure, an article number or an enforcement action. You have the items below and nothing else. If an item does not support a claim, do not make it.
- Do not oversell ActComply. One mention at the end, as the thing Zac is building, not a pitch.

FORMAT
Plain text. Paragraphs separated by blank lines. Links as markdown: [label](url). No headings with # characters, no bullet characters at line start other than the numbered items described below.

Structure:
1. One opening paragraph, 2 to 3 sentences. The counter-narrative take on the week, drawn from the strongest item.
2. Then each item, as its own paragraph, in this shape:
   "N. [Headline as a short phrase](url)" on the first line, then the "what this means" sentence on the next line of the same paragraph.
   Rewrite the headline in your own words. Do not paste the publisher's.
3. If a resource is supplied, a short "Worth a longer read" paragraph linking it, one sentence on why it is relevant to this week.
4. A closing paragraph, one or two sentences, dry or reframing. No sign-off, no name.

Return only JSON, no prose, no markdown fence:
{"subject": "...", "body": "..."}

The subject is 4 to 9 words, specific to the lead story, no colon-prefix like "Issue 4:", no em dashes.`,
      messages: [
        {
          role: 'user',
          content: `This is issue ${issueNumber}. Write it from these ${items.length} items.

ITEMS
${itemBlock}

ACTCOMPLY RESOURCE FOR THE "WORTH A LONGER READ" SECTION
${resourceBlock}`,
        },
      ],
    })
  )

  const text = message.content.find(b => b.type === 'text')
  if (!text || text.type !== 'text') throw new Error('Claude returned no text block when composing')

  const parsed = parseJson(text.text) as Record<string, unknown>
  const subject = typeof parsed.subject === 'string' ? parsed.subject.trim() : ''
  const body = typeof parsed.body === 'string' ? parsed.body.trim() : ''
  if (!subject || body.length < 200) throw new Error('Composed issue is empty or too short to send')

  // Belt and braces on the house rule, the same way the SEO writer does it.
  const clean = (s: string) => s.replace(/\s*[—–]\s*/g, ', ').replace(/,\s*,/g, ',')

  return {
    subject: clean(subject),
    body: clean(body),
    items,
    resourceSlug: resource?.slug ?? null,
  }
}
