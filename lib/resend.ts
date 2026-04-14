import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY!)

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
