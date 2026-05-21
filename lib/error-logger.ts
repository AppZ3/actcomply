import Anthropic from '@anthropic-ai/sdk'
import { getSupabaseAdmin } from './supabase-admin'
import { getResend } from './resend'

interface ErrorContext {
  route: string
  userId?: string | null
  userEmail?: string | null
  userPlan?: string | null
  context?: Record<string, unknown>
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function stripControl(s: string): string {
  return s.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '')
}

export async function logError(err: unknown, meta: ErrorContext): Promise<void> {
  const message = stripControl(err instanceof Error ? err.message : String(err))
  const stack = err instanceof Error ? (err.stack ? stripControl(err.stack) : null) : null

  // Save to DB (fire and forget, don't let logging failure break anything)
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
      subject: `[Error] ${meta.route}, ${message.slice(0, 80)}`,
      html: `
        <div style="font-family:monospace;max-width:700px;margin:0 auto;color:#111">
          <div style="background:#0f172a;padding:16px 24px;border-radius:8px 8px 0 0">
            <span style="color:#ef4444;font-weight:700;font-size:16px">ActComply Error Alert</span>
          </div>
          <div style="border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 8px 8px">

            <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:13px">
              <tr style="background:#f8fafc">
                <td style="padding:8px 12px;font-weight:600;color:#475569;width:120px">Route</td>
                <td style="padding:8px 12px;color:#ef4444;font-weight:600">${escapeHtml(meta.route)}</td>
              </tr>
              <tr>
                <td style="padding:8px 12px;font-weight:600;color:#475569">Time</td>
                <td style="padding:8px 12px">${new Date().toUTCString()}</td>
              </tr>
              ${meta.userId ? `
              <tr style="background:#f8fafc">
                <td style="padding:8px 12px;font-weight:600;color:#475569">User ID</td>
                <td style="padding:8px 12px">${escapeHtml(String(meta.userId))}</td>
              </tr>` : ''}
              ${meta.userEmail ? `
              <tr>
                <td style="padding:8px 12px;font-weight:600;color:#475569">Email</td>
                <td style="padding:8px 12px">${escapeHtml(String(meta.userEmail))}</td>
              </tr>` : ''}
              ${meta.userPlan ? `
              <tr style="background:#f8fafc">
                <td style="padding:8px 12px;font-weight:600;color:#475569">Plan</td>
                <td style="padding:8px 12px">${escapeHtml(String(meta.userPlan))}</td>
              </tr>` : ''}
            </table>

            <div style="margin-bottom:16px">
              <div style="font-size:11px;font-weight:600;color:#ef4444;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">Error</div>
              <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:12px 16px;font-size:13px;color:#991b1b">${escapeHtml(message)}</div>
            </div>

            ${stack ? `
            <div style="margin-bottom:16px">
              <div style="font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">Stack Trace</div>
              <pre style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:6px;padding:12px 16px;font-size:11px;color:#334155;overflow-x:auto;white-space:pre-wrap;margin:0">${escapeHtml(stack)}</pre>
            </div>` : ''}

            ${meta.context ? `
            <div>
              <div style="font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">Context</div>
              <pre style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:6px;padding:12px 16px;font-size:11px;color:#334155;overflow-x:auto;white-space:pre-wrap;margin:0">${escapeHtml(JSON.stringify(meta.context, null, 2))}</pre>
            </div>` : ''}

          </div>
        </div>
      `,
    })
  } catch {
    // If email fails, silently ignore, error is already in DB
  }

  // Fire Claude analysis in background, don't await, never blocks the caller
  analyzeAndEmail(message, stack, meta).then(() => {}, () => {})
}

async function analyzeAndEmail(
  message: string,
  stack: string | null,
  meta: ErrorContext
): Promise<void> {
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const errorContext = `Route: ${meta.route}
Error: ${message}
${stack ? `Stack trace:\n${stack}` : ''}
${meta.context ? `Context: ${JSON.stringify(meta.context, null, 2)}` : ''}
${meta.userId ? `User ID: ${meta.userId}` : ''}
${meta.userPlan ? `Plan: ${meta.userPlan}` : ''}`

    // Pass 1, Haiku drafts the fix
    const draftResponse = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{
        role: 'user',
        content: `You are debugging a production error in the ActComply EU AI Act compliance platform (Next.js App Router, Supabase, Stripe, Resend).

${errorContext}

Diagnose the root cause and provide a concrete fix. Structure your response as:
1. **Root cause** (1-2 sentences)
2. **Most likely fix** (specific code change or config, ready to apply)
3. **How to verify** (one quick check to confirm it's resolved)`,
      }],
    })

    const draft = draftResponse.content[0].type === 'text' ? draftResponse.content[0].text : ''

    // Pass 2, Sonnet stress-tests the draft fix
    const verifyResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 700,
      messages: [{
        role: 'user',
        content: `You are a senior engineer reviewing a proposed fix for a production error in the ActComply EU AI Act compliance platform (Next.js App Router, Supabase, Stripe, Resend).

## Error context
${errorContext}

## Proposed fix
${draft}

Review this fix critically. Your job is to catch mistakes before they reach production.

Respond in this exact structure:
**Verdict**: APPROVED | NEEDS_CORRECTION | RISKY
**Confidence**: High | Medium | Low
**Issues found**: (list any problems with the proposed fix, or "None")
**Final fix**: (the corrected fix if changes needed, or "Use proposed fix as-is")
**New errors this could introduce**: (list risks, or "None identified")`,
      }],
    })

    const verification = verifyResponse.content[0].type === 'text' ? verifyResponse.content[0].text : ''

    const verdict = verification.includes('APPROVED') ? 'APPROVED'
      : verification.includes('RISKY') ? 'RISKY'
      : 'NEEDS_CORRECTION'

    const verdictColor = verdict === 'APPROVED' ? '#16a34a'
      : verdict === 'RISKY' ? '#dc2626'
      : '#d97706'

    const verdictBg = verdict === 'APPROVED' ? '#f0fdf4'
      : verdict === 'RISKY' ? '#fef2f2'
      : '#fffbeb'

    const verdictBorder = verdict === 'APPROVED' ? '#bbf7d0'
      : verdict === 'RISKY' ? '#fecaca'
      : '#fde68a'

    await getResend().emails.send({
      from: 'ActComply Errors <hello@getactcomply.com>',
      to: 'zaclowe@outlook.com.au',
      subject: `[${verdict}] Fix for ${meta.route}, ${message.slice(0, 60)}`,
      html: `
        <div style="font-family:sans-serif;max-width:700px;margin:0 auto;color:#111">
          <div style="background:#0f172a;padding:16px 24px;border-radius:8px 8px 0 0;display:flex;align-items:center;gap:12px">
            <span style="color:#22c55e;font-weight:700;font-size:16px">Verified Fix Suggestion</span>
            <span style="background:${verdictColor};color:white;font-size:11px;font-weight:700;padding:2px 10px;border-radius:999px;letter-spacing:.05em">${verdict}</span>
          </div>
          <div style="border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 8px 8px">

            <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:10px 14px;margin-bottom:20px;font-size:13px;color:#991b1b;font-family:monospace">${escapeHtml(message)}</div>

            <h3 style="font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.05em;margin:0 0 8px">Draft fix (Haiku)</h3>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:14px 16px;font-size:13px;line-height:1.7;white-space:pre-wrap;color:#334155;margin-bottom:20px">${escapeHtml(draft)}</div>

            <h3 style="font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.05em;margin:0 0 8px">Verification review (Sonnet)</h3>
            <div style="background:${verdictBg};border:1px solid ${verdictBorder};border-radius:6px;padding:14px 16px;font-size:13px;line-height:1.7;white-space:pre-wrap;color:#1e293b">${escapeHtml(verification)}</div>

          </div>
        </div>
      `,
    })
  } catch {
    // Analysis is best-effort, silently ignore failures
  }
}
