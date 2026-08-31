import { describe, it, expect } from 'vitest'
import { sanitiseHtml, stripEmDashes } from '../lib/seo-writer'

// The rendered resource page injects this content with dangerouslySetInnerHTML,
// so anything the model emits is untrusted markup until sanitiseHtml has run.

describe('sanitiseHtml', () => {
  it('removes script elements and their contents', () => {
    const out = sanitiseHtml('<p>Before</p><script>alert(1)</script><p>After</p>')
    expect(out).not.toContain('alert(1)')
    expect(out).not.toContain('<script')
    expect(out).toContain('<p>Before</p>')
    expect(out).toContain('<p>After</p>')
  })

  it('removes self-closing and unclosed script-like tags', () => {
    expect(sanitiseHtml('<p>a</p><iframe src="https://evil.test" />')).not.toContain('iframe')
    expect(sanitiseHtml('<embed src="x">')).not.toContain('embed')
  })

  it('strips inline event handlers in quoted and bare forms', () => {
    expect(sanitiseHtml('<p onclick="steal()">hi</p>')).toBe('<p>hi</p>')
    expect(sanitiseHtml("<p onmouseover='x()'>hi</p>")).toBe('<p>hi</p>')
    expect(sanitiseHtml('<p onerror=x()>hi</p>')).toBe('<p>hi</p>')
  })

  it('strips javascript and data URLs from links', () => {
    expect(sanitiseHtml('<a href="javascript:alert(1)">x</a>')).toBe('<a>x</a>')
    expect(sanitiseHtml('<a href="data:text/html;base64,PHM+">x</a>')).toBe('<a>x</a>')
  })

  it('keeps ordinary links and the article tag set', () => {
    const html =
      '<h2>Heading</h2><p>Text with <strong>bold</strong> and ' +
      '<a href="https://www.getactcomply.com/check">a link</a>.</p><ul><li>One</li></ul>'
    expect(sanitiseHtml(html)).toBe(html)
  })

  it('unwraps tags outside the allowlist but keeps their text', () => {
    expect(sanitiseHtml('<p>Hello <marquee>there</marquee></p>')).toBe('<p>Hello there</p>')
  })
})

describe('stripEmDashes', () => {
  it('replaces em and en dashes with a comma', () => {
    expect(stripEmDashes('This is not future — it is now')).toBe('This is not future, it is now')
    expect(stripEmDashes('Range – here')).toBe('Range, here')
  })

  it('does not leave doubled commas when the dash followed one', () => {
    expect(stripEmDashes('One, — two')).toBe('One, two')
  })

  it('leaves hyphens alone', () => {
    expect(stripEmDashes('high-risk AI systems')).toBe('high-risk AI systems')
  })
})
