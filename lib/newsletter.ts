// Newsletter helpers, token generation, plain-text-to-HTML rendering, send templates.
// Uses the same Resend client / Supabase admin as the rest of the platform.

import { randomBytes } from 'node:crypto'

export function newUnsubscribeToken(): string {
  return randomBytes(24).toString('base64url')
}

/** Exported because every interpolation of untrusted text needs it, not just the body. */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Only http(s) becomes a link. Anything else stays as visible text so a
// javascript: or data: URL cannot reach the rendered email.
function renderLinks(escaped: string): string {
  return escaped.replace(
    /\[([^\]]{1,200})\]\((https?:\/\/[^\s)]{1,500})\)/g,
    (_m, label: string, href: string) =>
      `<a href="${href}" style="color:#2563eb;text-decoration:underline">${label}</a>`
  )
}

// Convert a plain-text body (paragraphs separated by blank lines) into email
// HTML. Markdown links, [label](url), become anchors.
//
// The body is escaped first. It used to be interpolated raw on the grounds that
// we authored every word, but issues are now composed from third-party feed
// titles and summaries, so a publisher's headline must never be able to inject
// markup into an email going out under Zac's name.
export function bodyToHtml(body: string): string {
  return body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => renderLinks(escapeHtml(p)).replace(/\n/g, '<br/>'))
    .map((p) => `<p style="margin:0 0 16px 0;line-height:1.7;color:#334155;font-size:15px">${p}</p>`)
    .join('\n')
}

/**
 * The email chrome around a rendered body.
 *
 * `subject` is escaped here for the same reason the body is: issues are now
 * composed from third-party feed titles, so the headline is untrusted text on
 * exactly the same path as the paragraphs beneath it. `bodyHtml` arrives
 * already rendered and escaped by bodyToHtml, and `unsubscribeUrl` is a token
 * we generate, so neither is escaped again here.
 */
export function newsletterShellHtml({
  subject,
  bodyHtml,
  unsubscribeUrl,
  webViewUrl,
}: {
  subject: string
  bodyHtml: string
  unsubscribeUrl: string
  webViewUrl?: string
}): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;color:#111">
  <div style="max-width:640px;margin:0 auto;padding:24px 16px">
    <div style="background:#0f172a;padding:20px 28px;border-radius:12px 12px 0 0">
      <span style="color:#fff;font-weight:700;font-size:17px">ActComply</span>
      <span style="color:#64748b;font-size:13px;margin-left:8px">Builder's Notes on the EU AI Act</span>
    </div>
    <div style="background:#fff;border:1px solid #e2e8f0;border-top:none;padding:32px;border-radius:0 0 12px 12px">
      <h1 style="margin:0 0 24px 0;font-size:24px;line-height:1.3;color:#0f172a">${escapeHtml(subject)}</h1>
      ${bodyHtml}
      <div style="margin-top:32px;padding-top:20px;border-top:1px solid #e2e8f0">
        <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6">
          You're receiving this because you signed up to the ActComply builder's newsletter.
          ${webViewUrl ? `<a href="${webViewUrl}" style="color:#94a3b8;text-decoration:underline">View in browser</a> · ` : ''}<a href="${unsubscribeUrl}" style="color:#94a3b8;text-decoration:underline">Unsubscribe</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>`
}

export function welcomeEmailHtml(unsubscribeUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;color:#111">
  <div style="max-width:640px;margin:0 auto;padding:24px 16px">
    <div style="background:#0f172a;padding:20px 28px;border-radius:12px 12px 0 0">
      <span style="color:#fff;font-weight:700;font-size:17px">ActComply</span>
    </div>
    <div style="background:#fff;border:1px solid #e2e8f0;border-top:none;padding:32px;border-radius:0 0 12px 12px">
      <h2 style="margin:0 0 16px;font-size:22px">You're in.</h2>
      <p style="color:#475569;line-height:1.7;margin:0 0 16px;font-size:15px">
        I'll send you one issue when it's worth your time, usually weekly. The angle is straight-talking notes on the EU AI Act for people who actually ship AI products, not lawyers.
      </p>
      <p style="color:#475569;line-height:1.7;margin:0 0 16px;font-size:15px">
        I'm Zac, building <a href="https://getactcomply.com" style="color:#2563eb">ActComply</a>, compliance tooling for AI builders. The newsletter is the public-facing version of what I'm learning while I build.
      </p>
      <p style="color:#475569;line-height:1.7;margin:0 0 16px;font-size:15px">
        First issue lands soon. Hit reply any time. Your replies go to my inbox.
      </p>
      <div style="margin-top:32px;padding-top:20px;border-top:1px solid #e2e8f0">
        <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6">
          <a href="${unsubscribeUrl}" style="color:#94a3b8;text-decoration:underline">Unsubscribe</a> any time.
        </p>
      </div>
    </div>
  </div>
</body>
</html>`
}
