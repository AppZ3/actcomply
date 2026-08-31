import { describe, it, expect } from 'vitest'
import { parseFeed } from '../lib/feed-parser'
import { FEED_SOURCES } from '../lib/feed-sources'

const RSS = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <title>Example</title>
    <item>
      <title>Article 50 guidance lands</title>
      <link>https://example.test/a</link>
      <guid isPermaLink="false">tag:example,2026:1</guid>
      <pubDate>Wed, 26 Aug 2026 09:00:00 +0000</pubDate>
      <description><![CDATA[<p>Some <b>markup</b> and an entity: Brazil&amp;#039;s law.</p>]]></description>
    </item>
    <item>
      <title>Second item without a guid</title>
      <link>https://example.test/b</link>
      <pubDate>Tue, 25 Aug 2026 09:00:00 +0000</pubDate>
    </item>
  </channel>
</rss>`

const ATOM = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Atom Example</title>
  <entry>
    <title>Annex III deferral explained</title>
    <link rel="edit" href="https://example.test/edit/1"/>
    <link rel="alternate" href="https://example.test/atom-1"/>
    <id>urn:uuid:1</id>
    <updated>2026-08-20T10:00:00Z</updated>
    <summary>A short summary.</summary>
  </entry>
</feed>`

describe('parseFeed, RSS', () => {
  it('extracts the fields the pipeline needs', () => {
    const [first] = parseFeed(RSS)
    expect(first.title).toBe('Article 50 guidance lands')
    expect(first.url).toBe('https://example.test/a')
    expect(first.guid).toBe('tag:example,2026:1')
    expect(first.publishedAt).toBe('2026-08-26T09:00:00.000Z')
  })

  it('strips markup and decodes double-encoded entities in summaries', () => {
    const [first] = parseFeed(RSS)
    expect(first.summary).toBe("Some markup and an entity: Brazil's law.")
    expect(first.summary).not.toContain('<')
    expect(first.summary).not.toContain('&#')
  })

  it('falls back to the URL when an item has no guid', () => {
    const items = parseFeed(RSS)
    expect(items[1].guid).toBe('https://example.test/b')
  })

  it('tolerates a missing description', () => {
    expect(parseFeed(RSS)[1].summary).toBeNull()
  })
})

describe('parseFeed, Atom', () => {
  it('prefers the alternate link over other relations', () => {
    const [entry] = parseFeed(ATOM)
    expect(entry.url).toBe('https://example.test/atom-1')
    expect(entry.guid).toBe('urn:uuid:1')
    expect(entry.publishedAt).toBe('2026-08-20T10:00:00.000Z')
  })
})

describe('parseFeed, robustness', () => {
  it('returns an empty list for HTML rather than throwing', () => {
    // Four candidate sources served HTML from their advertised feed URL. A
    // source doing that must skip, not break the whole poll.
    expect(parseFeed('<!DOCTYPE html><html><body>Not a feed</body></html>')).toEqual([])
    expect(parseFeed('')).toEqual([])
    expect(parseFeed('{"json": true}')).toEqual([])
  })

  it('drops items with no link or no title', () => {
    const xml = `<rss version="2.0"><channel>
      <item><title>No link</title></item>
      <item><link>https://example.test/c</link></item>
      <item><title>Good</title><link>https://example.test/d</link></item>
    </channel></rss>`
    const items = parseFeed(xml)
    expect(items).toHaveLength(1)
    expect(items[0].title).toBe('Good')
  })

  it('deduplicates repeated guids, keeping the first', () => {
    const xml = `<rss version="2.0"><channel>
      <item><title>First</title><link>https://example.test/x</link><guid>same</guid></item>
      <item><title>Duplicate</title><link>https://example.test/y</link><guid>same</guid></item>
    </channel></rss>`
    const items = parseFeed(xml)
    expect(items).toHaveLength(1)
    expect(items[0].title).toBe('First')
  })

  it('decodes entities in URLs, which feeds routinely emit as &#038;', () => {
    const xml = `<rss version="2.0"><channel>
      <item><title>T</title><link>https://example.test/p?a=1&amp;#038;b=2</link></item>
    </channel></rss>`
    expect(parseFeed(xml)[0].url).toBe('https://example.test/p?a=1&b=2')
  })

  it('honours maxItems', () => {
    const body = Array.from({ length: 10 }, (_, i) =>
      `<item><title>T${i}</title><link>https://example.test/${i}</link></item>`
    ).join('')
    expect(parseFeed(`<rss version="2.0"><channel>${body}</channel></rss>`, { maxItems: 3 })).toHaveLength(3)
  })

  it('leaves an unparseable date null rather than inventing one', () => {
    const xml = `<rss version="2.0"><channel>
      <item><title>T</title><link>https://example.test/z</link><pubDate>not a date</pubDate></item>
    </channel></rss>`
    expect(parseFeed(xml)[0].publishedAt).toBeNull()
  })
})

describe('FEED_SOURCES', () => {
  it('has unique keys, since items are stored against them', () => {
    const keys = FEED_SOURCES.map(s => s.key)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('uses https everywhere', () => {
    for (const s of FEED_SOURCES) expect(s.url.startsWith('https://')).toBe(true)
  })

  it('still includes at least three tier 1 sources', () => {
    expect(FEED_SOURCES.filter(s => s.tier === 1).length).toBeGreaterThanOrEqual(3)
  })
})
