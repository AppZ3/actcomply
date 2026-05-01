import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY!)

export async function sendWelcomeEmail({ to }: { to: string }) {
  await resend.emails.send({
    from: 'ActComply <hello@getactcomply.com>',
    to,
    subject: 'Welcome to ActComply',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111">
        <div style="background:#0f172a;padding:24px 32px;border-radius:12px 12px 0 0">
          <span style="color:#fff;font-weight:700;font-size:18px">ActComply</span>
        </div>
        <div style="border:1px solid #e2e8f0;border-top:none;padding:32px;border-radius:0 0 12px 12px">
          <h2 style="margin:0 0 12px;font-size:22px">Welcome aboard</h2>
          <p style="color:#475569;line-height:1.6;margin:0 0 16px">
            You're now signed in to ActComply. The EU AI Act enforcement deadline is
            <strong>2 August 2026</strong> — use the dashboard to assess your AI systems,
            track compliance requirements, and generate audit-ready documentation.
          </p>
          <p style="color:#475569;line-height:1.6;margin:0 0 28px">
            Start by running your first assessment — it takes under 30 seconds.
          </p>
          <a href="https://getactcomply.com/assess" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
            Run your first assessment →
          </a>
          <p style="margin-top:32px;font-size:12px;color:#94a3b8">
            Questions? Reply to this email or visit
            <a href="https://getactcomply.com/support" style="color:#94a3b8">getactcomply.com/support</a>
          </p>
        </div>
      </div>
    `,
  })
}

export async function sendAlertDigestEmail({
  to,
  alerts,
}: {
  to: string
  alerts: { id: string; title: string; summary: string; article_refs: string; severity: string; published_at: string }[]
}) {
  const criticalCount = alerts.filter(a => a.severity === 'critical').length
  const subjectPrefix = criticalCount > 0 ? `🔴 ${criticalCount} critical` : `📋 ${alerts.length}`

  const alertRows = alerts.map(a => {
    const color = a.severity === 'critical' ? '#ef4444' : a.severity === 'warning' ? '#f59e0b' : '#3b82f6'
    const label = a.severity === 'critical' ? 'Critical' : a.severity === 'warning' ? 'Warning' : 'Info'
    const date = new Date(a.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    return `
      <div style="border:1px solid #e2e8f0;border-left:3px solid ${color};border-radius:8px;padding:16px 20px;margin-bottom:12px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
          <span style="font-size:11px;font-weight:600;color:${color};text-transform:uppercase">${label}</span>
          <span style="font-size:11px;color:#94a3b8">${date}</span>
          <span style="font-size:11px;font-family:monospace;color:#3b82f6">${a.article_refs}</span>
        </div>
        <h3 style="margin:0 0 6px;font-size:15px;color:#111">${a.title}</h3>
        <p style="margin:0;font-size:13px;color:#475569;line-height:1.5">${a.summary}</p>
      </div>
    `
  }).join('')

  await resend.emails.send({
    from: 'ActComply Alerts <alerts@getactcomply.com>',
    to,
    subject: `${subjectPrefix} unread EU AI Act alerts — ActComply weekly digest`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111">
        <div style="background:#0f172a;padding:24px 32px;border-radius:12px 12px 0 0">
          <span style="color:#fff;font-weight:700;font-size:18px">ActComply</span>
          <span style="color:#64748b;font-size:13px;margin-left:8px">Weekly Digest</span>
        </div>
        <div style="border:1px solid #e2e8f0;border-top:none;padding:32px;border-radius:0 0 12px 12px">
          <h2 style="margin:0 0 8px;font-size:20px">You have ${alerts.length} unread regulatory alert${alerts.length > 1 ? 's' : ''}</h2>
          <p style="color:#64748b;font-size:13px;margin:0 0 24px">EU AI Act updates from the past 7 days.</p>
          ${alertRows}
          <div style="margin-top:24px">
            <a href="https://getactcomply.com/dashboard/alerts" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
              View all alerts in dashboard →
            </a>
          </div>
          <p style="margin-top:32px;font-size:12px;color:#94a3b8">
            You're receiving this weekly digest because you have an active ActComply subscription.<br>
            <a href="https://getactcomply.com/dashboard/billing" style="color:#94a3b8">Manage notifications</a>
          </p>
        </div>
      </div>
    `,
  })
}

export async function sendAlertEmail({
  to,
  title,
  summary,
  articleRefs,
  severity,
}: {
  to: string
  title: string
  summary: string
  articleRefs: string
  severity: string
}) {
  const severityLabel = severity === 'critical' ? '🔴 Critical' : severity === 'warning' ? '🟡 Warning' : '🔵 Info'

  await resend.emails.send({
    from: 'ActComply Alerts <alerts@getactcomply.com>',
    to,
    subject: `[${severityLabel}] ${title}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111">
        <div style="background:#0f172a;padding:24px 32px;border-radius:12px 12px 0 0">
          <span style="color:#fff;font-weight:700;font-size:18px">ActComply</span>
          <span style="color:#64748b;font-size:13px;margin-left:8px">Regulatory Alert</span>
        </div>
        <div style="border:1px solid #e2e8f0;border-top:none;padding:32px;border-radius:0 0 12px 12px">
          <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:${severity === 'critical' ? '#ef4444' : severity === 'warning' ? '#f59e0b' : '#3b82f6'};margin-bottom:8px">
            ${severityLabel}
          </div>
          <h2 style="margin:0 0 16px;font-size:20px;line-height:1.3">${title}</h2>
          <p style="color:#475569;line-height:1.6;margin:0 0 20px">${summary}</p>
          <div style="background:#f8fafc;border-radius:8px;padding:12px 16px;font-size:13px;color:#64748b">
            <strong>Regulatory reference:</strong> ${articleRefs}
          </div>
          <div style="margin-top:28px">
            <a href="https://getactcomply.com/dashboard/alerts" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
              View in dashboard →
            </a>
          </div>
          <p style="margin-top:32px;font-size:12px;color:#94a3b8">
            You're receiving this because you have an active ActComply subscription.<br>
            <a href="https://getactcomply.com/dashboard/billing" style="color:#94a3b8">Manage notifications</a>
          </p>
        </div>
      </div>
    `,
  })
}
