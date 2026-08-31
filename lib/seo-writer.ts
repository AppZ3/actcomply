import Anthropic from '@anthropic-ai/sdk'
import { withRetry } from './anthropic'
import { getEnforcementStatus } from './eu-ai-act'
import type { SeoTopic } from './seo-topics'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface DraftedPage {
  slug: string
  title: string
  meta_description: string
  content: string
  internal_links: string[]
  schema_markup: Record<string, unknown>
}

/**
 * The rendered page injects `content` with dangerouslySetInnerHTML, so model
 * output is untrusted markup until it has been through here. Allow the tag set
 * the article body actually needs and drop everything else, rather than trying
 * to enumerate what is dangerous.
 */
const ALLOWED_TAGS = new Set([
  'p', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'strong', 'em', 'a', 'blockquote',
  'table', 'thead', 'tbody', 'tr', 'th', 'td', 'code', 'pre', 'br',
])

export function sanitiseHtml(html: string): string {
  return html
    // Whole elements whose content is executable or presentational, not prose.
    .replace(/<(script|style|iframe|object|embed|form|svg|math)\b[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<(script|style|iframe|object|embed|form|svg|math)\b[^>]*\/?>/gi, '')
    // Any tag outside the allowlist loses its angle brackets but keeps its text.
    .replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, (tag, name: string) =>
      ALLOWED_TAGS.has(name.toLowerCase()) ? tag : ''
    )
    // Inline event handlers, quoted or bare.
    .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, '')
    .replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, '')
    // Script-bearing URLs in href/src.
    .replace(/\s(href|src)\s*=\s*"(?:javascript|data|vbscript):[^"]*"/gi, '')
    .replace(/\s(href|src)\s*=\s*'(?:javascript|data|vbscript):[^']*'/gi, '')
}

/**
 * Zac's hard rule: no em dashes in published copy. The prompt says so, but one
 * page in sixty-eight still shipped with them, so the rule is enforced here as
 * well rather than trusted to the draft.
 */
export function stripEmDashes(text: string): string {
  return text.replace(/\s*[—–]\s*/g, ', ').replace(/,\s*,/g, ',')
}

function buildSystemPrompt(publishedSlugs: string[]): string {
  const enforcement = getEnforcementStatus()

  return `You write reference pages about the EU AI Act (Regulation EU 2024/1689) for ActComply, at getactcomply.com.

AUDIENCE
CTOs, founders and heads of product at EU companies of 20 to 500 people that ship AI products. Technical readers, not lawyers. They want to know what applies to them and what to do, not a restatement of the recitals.

WHERE THE TIMELINE ACTUALLY STANDS TODAY
- Enforcement powers went live on 2 August 2026 and are in force now. ${enforcement.enforcementLive ? 'That date has passed.' : 'That date has not yet passed.'}
- Prohibited practices under Article 5 have applied since 2 February 2025.
- GPAI obligations under Article 53 and transparency under Article 50 have been enforceable since 2 August 2026.
- Annex III standalone high-risk obligations apply from 2 December 2027, extended by the Digital Omnibus provisional agreement of May 2026, which is still pending formal adoption.
- Annex I embedded high-risk obligations apply from 2 August 2028.
${enforcement.next ? `- The next hard date is ${enforcement.next.displayDate}, ${enforcement.daysUntilNext} days away.` : ''}

Write in the tense that timeline implies. Enforcement is not something the reader is preparing for, it is something already happening to them. Never describe 2 August 2026 as upcoming.

HOUSE RULES, ALL STRICT
- Never use an em dash or an en dash. Use a comma, a full stop, or restructure. This one is absolute.
- Never invent an article number, an annex reference or a deadline. If you are not certain a provision exists, leave it out.
- No marketing filler, no "in today's fast-moving landscape", no rhetorical questions as headings.
- British spelling.
- Be concrete. "Keep logs for the lifetime of the system, at minimum six months" beats "ensure appropriate record keeping".

OUTPUT
Return a single JSON object and nothing else. No markdown fence, no commentary.

{
  "title": "6 to 10 words, descriptive, no em dashes",
  "meta_description": "at most 155 characters, includes the phrase EU AI Act and the main keyword",
  "content": "an HTML fragment, see rules below",
  "internal_links": ["2 to 3 slugs chosen from the published list"],
  "schema_markup": { "@context": "https://schema.org", "@type": "Article", "headline": "same as title" }
}

CONTENT RULES
- HTML fragment only. Permitted tags: p, h2, h3, ul, ol, li, strong, em, a, blockquote, table, thead, tbody, tr, th, td.
- No h1. The page renders its own from the title.
- No script, style or iframe tags, and no inline event attributes.
- At least 700 words.
- Structure: one short opening paragraph stating plainly what the page answers, then what the Act says with the actual provision cited, then who it applies to distinguishing provider from deployer, then what the obligation concretely requires, then the dates that bind, then a section of 3 to 5 specific actions, then a closing paragraph pointing to the free screener at https://www.getactcomply.com/check as an ordinary sentence rather than a sales pitch.

PAGES ALREADY PUBLISHED, for internal_links. Use only these slugs:
${publishedSlugs.join(', ')}`
}

/**
 * Draft one page. Returns fields already normalised and sanitised, ready to
 * upsert. Throws if the model returns something unusable.
 */
export async function draftSeoPage(
  topic: SeoTopic,
  publishedSlugs: string[]
): Promise<DraftedPage> {
  const message = await withRetry(() =>
    client.messages.create({
      model: 'claude-opus-5',
      max_tokens: 16000,
      thinking: { type: 'adaptive' },
      system: buildSystemPrompt(publishedSlugs),
      messages: [
        {
          role: 'user',
          content: `Write the page for slug "${topic.slug}".

Working title: ${topic.title}
The angle this page has to cover: ${topic.angle}

Return the JSON object only.`,
        },
      ],
    })
  )

  const text = message.content.find(b => b.type === 'text')
  if (!text || text.type !== 'text') {
    throw new Error('Claude returned no text block')
  }

  const raw = text.text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/, '')
    .trim()

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('Claude returned text that is not valid JSON')
  }

  const title = typeof parsed.title === 'string' ? stripEmDashes(parsed.title).trim() : topic.title
  const content = typeof parsed.content === 'string' ? parsed.content : ''
  if (content.length < 500) {
    throw new Error(`Draft for ${topic.slug} is too short to publish`)
  }

  const metaRaw = typeof parsed.meta_description === 'string' ? parsed.meta_description : ''
  const meta = stripEmDashes(metaRaw).trim().slice(0, 155)

  // Only keep links that point at pages which actually exist, so a hallucinated
  // slug cannot become a dead internal link.
  const published = new Set(publishedSlugs)
  const links = Array.isArray(parsed.internal_links)
    ? parsed.internal_links
        .filter((l): l is string => typeof l === 'string')
        .map(l => l.replace(/^\/resources\//, ''))
        .filter(l => published.has(l))
        .slice(0, 3)
    : []

  const schema =
    parsed.schema_markup && typeof parsed.schema_markup === 'object'
      ? (parsed.schema_markup as Record<string, unknown>)
      : { '@context': 'https://schema.org', '@type': 'Article', headline: title }

  return {
    slug: topic.slug,
    title,
    meta_description: meta,
    content: sanitiseHtml(stripEmDashes(content)),
    internal_links: links,
    schema_markup: schema,
  }
}
