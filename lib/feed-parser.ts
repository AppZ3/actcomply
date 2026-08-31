import { XMLParser } from 'fast-xml-parser'

export interface ParsedFeedItem {
  guid: string
  url: string
  title: string
  summary: string | null
  publishedAt: string | null
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  // Feeds are wildly inconsistent about whether a field appears once or many
  // times, so never collapse a single child into a scalar silently.
  trimValues: true,
  parseTagValue: false,
  processEntities: true,
})

function asArray<T>(v: T | T[] | undefined | null): T[] {
  if (v === undefined || v === null) return []
  return Array.isArray(v) ? v : [v]
}

/** Feed fields arrive as a string, a CDATA object, or an attributed node. */
function text(node: unknown): string {
  if (node === undefined || node === null) return ''
  if (typeof node === 'string') return node
  if (typeof node === 'number') return String(node)
  if (typeof node === 'object') {
    const obj = node as Record<string, unknown>
    if (typeof obj['#text'] === 'string') return obj['#text']
    if (typeof obj['@_href'] === 'string') return obj['@_href']
  }
  return ''
}

/**
 * Atom links are a list of typed relations. The readable article is rel
 * "alternate", or the first link with no rel at all.
 */
function atomLink(entry: Record<string, unknown>): string {
  const links = asArray(entry.link as unknown)
  for (const l of links) {
    const rel = typeof l === 'object' && l !== null ? (l as Record<string, unknown>)['@_rel'] : undefined
    if (rel === undefined || rel === 'alternate') {
      const href = text(l)
      if (href) return href
    }
  }
  return links.length ? text(links[0]) : ''
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  ldquo: '\u201c', rdquo: '\u201d', lsquo: '\u2018', rsquo: '\u2019',
  mdash: '\u2014', ndash: '\u2013', hellip: '\u2026',
}

/**
 * Feeds routinely double-encode, so the XML parser resolves `&amp;#039;` to the
 * literal text `&#039;` and the apostrophe never appears. Decode whatever
 * entities are left after parsing, repeatedly, until the text stops changing.
 */
function decodeEntities(s: string): string {
  let out = s
  for (let i = 0; i < 3; i++) {
    const next = out
      .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
      .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(parseInt(dec, 10)))
      .replace(/&([a-z]+);/gi, (m, name: string) => NAMED_ENTITIES[name.toLowerCase()] ?? m)
    if (next === out) break
    out = next
  }
  return out
}

function stripHtml(s: string): string {
  return decodeEntities(s)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function toIso(raw: string): string | null {
  if (!raw) return null
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

/**
 * Parse an RSS 2.0 or Atom document into a normalised item list.
 *
 * Returns [] rather than throwing when the document is not a feed, because a
 * source serving an HTML error page should skip that source, not fail the
 * whole poll. Callers report the empty result.
 */
export function parseFeed(xml: string, opts: { maxItems?: number } = {}): ParsedFeedItem[] {
  const max = opts.maxItems ?? 50

  let doc: Record<string, unknown>
  try {
    doc = parser.parse(xml) as Record<string, unknown>
  } catch {
    return []
  }
  if (!doc || typeof doc !== 'object') return []

  const items: ParsedFeedItem[] = []

  // RSS 2.0: rss > channel > item
  const rss = doc.rss as Record<string, unknown> | undefined
  const channel = rss?.channel as Record<string, unknown> | undefined
  for (const raw of asArray(channel?.item as unknown)) {
    const it = raw as Record<string, unknown>
    const url = decodeEntities(text(it.link)).trim()
    const title = stripHtml(text(it.title))
    if (!url || !title) continue
    const summary = stripHtml(text(it.description) || text(it['content:encoded']))
    items.push({
      guid: (decodeEntities(text(it.guid)) || url).trim(),
      url,
      title,
      summary: summary ? summary.slice(0, 1200) : null,
      publishedAt: toIso(text(it.pubDate) || text(it['dc:date'])),
    })
  }

  // Atom: feed > entry
  const feed = doc.feed as Record<string, unknown> | undefined
  for (const raw of asArray(feed?.entry as unknown)) {
    const e = raw as Record<string, unknown>
    const url = decodeEntities(atomLink(e)).trim()
    const title = stripHtml(text(e.title))
    if (!url || !title) continue
    const summary = stripHtml(text(e.summary) || text(e.content))
    items.push({
      guid: (decodeEntities(text(e.id)) || url).trim(),
      url,
      title,
      summary: summary ? summary.slice(0, 1200) : null,
      publishedAt: toIso(text(e.published) || text(e.updated)),
    })
  }

  // A feed can repeat a guid across pages; keep the first occurrence.
  const seen = new Set<string>()
  const deduped = items.filter(i => {
    if (seen.has(i.guid)) return false
    seen.add(i.guid)
    return true
  })

  return deduped.slice(0, max)
}
