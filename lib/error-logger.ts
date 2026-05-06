import { getSupabaseAdmin } from './supabase-admin'
import { getResend } from './resend'

interface ErrorContext {
  route: string
  userId?: string | null
  userEmail?: string | null
  userPlan?: string | null
  context?: Record<string, unknown>
}

export async function logError(err: unknown, meta: ErrorContext): Promise<void> {
  const message = err instanceof Error ? err.message : String(err)
  const stack = err instanceof Error ? (err.stack ?? null) : null

  // Save to DB (fire and forget — don't let logging failure break anything)
  getSupabaseAdmin().from('error_logs').insert({
    route: meta.route,
    user_id: meta.userId ?? null,
    user_email: meta.userEmail ?? null,
    user_plan: meta.userPlan ?? null,
    error_message: message,
    error_stack: stack,
    context: meta.context ?? null,
  }).then(() => {}, () => {})

  // Send immediate alert email to Zac
  try {
    await getResend().emails.send({
      from: 'ActComply Errors <hello@getactcomply.com>',
      to: 'zaclowe@outlook.com.au',
      subject: `[Error] ${meta.route} — ${message.slice(0, 80)}`,
      html: `
        <div style="font-family:monospace;max-width:700px;margin:0 auto;color:#111">
          <div style="background:#0f172a;padding:16px 24px;border-radius:8px 8px 0 0">
            <span style="color:#ef4444;font-weight:700;font-size:16px">ActComply Error Alert</span>
          </div>
          <div style="border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 8px 8px">

            <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:13px">
              <tr style="background:#f8fafc">
                <td style="padding:8px 12px;font-weight:600;color:#475569;width:120px">Route</td>
                <td style="padding:8px 12px;color:#ef4444;font-weight:600">${meta.route}</td>
              </tr>
              <tr>
                <td style="padding:8px 12px;font-weight:600;color:#475569">Time</td>
                <td style="padding:8px 12px">${new Date().toUTCString()}</td>
              </tr>
              ${meta.userId ? `
              <tr style="background:#f8fafc">
                <td style="padding:8px 12px;font-weight:600;color:#475569">User ID</td>
                <td style="padding:8px 12px">${meta.userId}</td>
              </tr>` : ''}
              ${meta.userEmail ? `
              <tr>
                <td style="padding:8px 12px;font-weight:600;color:#475569">Email</td>
                <td style="padding:8px 12px">${meta.userEmail}</td>
              </tr>` : ''}
              ${meta.userPlan ? `
              <tr style="background:#f8fafc">
                <td style="padding:8px 12px;font-weight:600;color:#475569">Plan</td>
                <td style="padding:8px 12px">${meta.userPlan}</td>
              </tr>` : ''}
            </table>

            <div style="margin-bottom:16px">
              <div style="font-size:11px;font-weight:600;color:#ef4444;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">Error</div>
              <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:12px 16px;font-size:13px;color:#991b1b">${message}</div>
            </div>

            ${stack ? `
            <div style="margin-bottom:16px">
              <div style="font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">Stack Trace</div>
              <pre style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:6px;padding:12px 16px;font-size:11px;color:#334155;overflow-x:auto;white-space:pre-wrap;margin:0">${stack}</pre>
            </div>` : ''}

            ${meta.context ? `
            <div>
              <div style="font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">Context</div>
              <pre style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:6px;padding:12px 16px;font-size:11px;color:#334155;overflow-x:auto;white-space:pre-wrap;margin:0">${JSON.stringify(meta.context, null, 2)}</pre>
            </div>` : ''}

          </div>
        </div>
      `,
    })
  } catch {
    // If email fails, silently ignore — error is already in DB
  }
}
