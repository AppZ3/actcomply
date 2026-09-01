import { describe, it, expect } from 'vitest'
import { bodyToHtml, newsletterShellHtml, escapeHtml } from '../lib/newsletter'

// Issues are now assembled from third-party feed titles and summaries, so this
// renderer is the boundary between a publisher's text and an email going out
// under Zac's name.

describe('bodyToHtml', () => {
  it('wraps blank-line-separated paragraphs', () => {
    const html = bodyToHtml('First para.\n\nSecond para.')
    expect(html.match(/<p /g)).toHaveLength(2)
    expect(html).toContain('First para.')
    expect(html).toContain('Second para.')
  })

  it('turns a single newline into a line break inside one paragraph', () => {
    const html = bodyToHtml('Line one\nLine two')
    expect(html.match(/<p /g)).toHaveLength(1)
    expect(html).toContain('<br/>')
  })

  it('renders markdown links as anchors', () => {
    const html = bodyToHtml('See [the guidance](https://example.test/a) for detail.')
    expect(html).toContain('<a href="https://example.test/a"')
    expect(html).toContain('>the guidance</a>')
  })

  it('escapes markup in a hostile feed title', () => {
    const html = bodyToHtml('1. <script>alert(1)</script> hello')
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('escapes quotes and ampersands', () => {
    const html = bodyToHtml('Tom & "Jerry"')
    expect(html).toContain('&amp;')
    expect(html).toContain('&quot;')
  })

  it('refuses to linkify javascript and data URLs, leaving them as text', () => {
    const js = bodyToHtml('[click](javascript:alert(1))')
    expect(js).not.toContain('<a href')
    const data = bodyToHtml('[click](data:text/html;base64,PHM+)')
    expect(data).not.toContain('<a href')
  })

  it('cannot be tricked into breaking out of the href attribute', () => {
    // The quote is escaped before links are rendered, so it can never close
    // the attribute the anchor is built with.
    const html = bodyToHtml('[x](https://example.test/a" onmouseover="steal())')
    expect(html).not.toContain('onmouseover="steal()"')
  })

  it('drops empty paragraphs', () => {
    expect(bodyToHtml('One.\n\n\n\n\nTwo.').match(/<p /g)).toHaveLength(2)
  })
})

describe('newsletterShellHtml', () => {
  const shell = (subject: string) =>
    newsletterShellHtml({ subject, bodyHtml: '<p>body</p>', unsubscribeUrl: 'https://example.test/u?token=abc' })

  it('escapes the subject in the h1', () => {
    const html = shell('<img src=x onerror=alert(1)>')
    expect(html).not.toContain('<img src=x')
    expect(html).toContain('&lt;img')
  })

  it('escapes the subject in the title tag too, not just the visible heading', () => {
    // The subject is interpolated in two places. Escaping only the h1 leaves
    // the head tag as a second injection point.
    const html = shell('</title><script>alert(1)</script>')
    expect(html).not.toContain('</title><script>')
    expect(html).not.toContain('<script>alert(1)</script>')
  })

  it('leaves the already-rendered body html alone', () => {
    // bodyToHtml has escaped it; escaping twice would show &amp;lt; to readers.
    const html = newsletterShellHtml({
      subject: 'Fine',
      bodyHtml: '<p>Escaped &amp; safe <a href="https://example.test/a">link</a></p>',
      unsubscribeUrl: 'https://example.test/u',
    })
    expect(html).toContain('<a href="https://example.test/a">link</a>')
    expect(html).not.toContain('&amp;amp;')
  })
})

describe('escapeHtml', () => {
  it('neutralises the characters that break out of text and attributes', () => {
    expect(escapeHtml('<b>&"')).toBe('&lt;b&gt;&amp;&quot;')
  })

  it('escapes the ampersand first, so escapes are not double-encoded', () => {
    expect(escapeHtml('a < b')).toBe('a &lt; b')
    expect(escapeHtml('&lt;')).toBe('&amp;lt;')
  })
})
