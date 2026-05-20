import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getResend } from '@/lib/resend'
import { logError } from '@/lib/error-logger'

const RISK_LEVELS = new Set(['PROHIBITED', 'HIGH_RISK', 'LIMITED_RISK', 'MINIMAL_RISK'] as const)
type RiskLevel = 'PROHIBITED' | 'HIGH_RISK' | 'LIMITED_RISK' | 'MINIMAL_RISK'

const MAX_EMAIL_LENGTH = 254
const MAX_SYSTEM_NAME = 200
const MAX_SECTOR = 100
const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/

const RATE_WINDOW_MS = 60 * 60 * 1000
const RATE_MAX_PER_WINDOW = 5
const rateLimitMap = new Map<string, { count: number; windowStart: number }>()

function checkRateLimit(key: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(key)
  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    rateLimitMap.set(key, { count: 1, windowStart: now })
    if (rateLimitMap.size > 1000) {
      const cutoff = now - RATE_WINDOW_MS
      for (const [k, v] of rateLimitMap.entries()) {
        if (v.windowStart < cutoff) rateLimitMap.delete(k)
      }
    }
    return true
  }
  if (entry.count >= RATE_MAX_PER_WINDOW) return false
  entry.count++
  return true
}

function clientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return req.headers.get('x-real-ip') || 'unknown'
}

function isSameOrigin(req: NextRequest): boolean {
  const host = req.headers.get('host')
  if (!host) return false
  const origin = req.headers.get('origin')
  if (origin) {
    try {
      return new URL(origin).host === host
    } catch {
      return false
    }
  }
  const referer = req.headers.get('referer')
  if (referer) {
    try {
      return new URL(referer).host === host
    } catch {
      return false
    }
  }
  return false
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function cleanText(input: unknown, max: number): string {
  if (typeof input !== 'string') return ''
  const stripped = input.replace(/[\x00-\x1f\x7f]/g, '').trim()
  return stripped.length > max ? stripped.slice(0, max) : stripped
}

export async function POST(req: NextRequest) {
  try {
    if (!isSameOrigin(req)) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }

    if (!checkRateLimit(clientIp(req))) {
      return NextResponse.json({ error: 'rate limited' }, { status: 429 })
    }

    const body: Record<string, unknown> = await req.json().catch(() => ({}))
    const emailRaw = typeof body.email === 'string' ? body.email.toLowerCase().trim() : ''
    if (!emailRaw || emailRaw.length > MAX_EMAIL_LENGTH || !EMAIL_RE.test(emailRaw)) {
      return NextResponse.json({ error: 'invalid email' }, { status: 400 })
    }
    const riskLevelRaw = typeof body.riskLevel === 'string' ? body.riskLevel : ''
    if (!RISK_LEVELS.has(riskLevelRaw as RiskLevel)) {
      return NextResponse.json({ error: 'invalid riskLevel' }, { status: 400 })
    }
    const riskLevel = riskLevelRaw as RiskLevel
    const systemName = cleanText(body.systemName, MAX_SYSTEM_NAME)
    const sector = cleanText(body.sector, MAX_SECTOR)

    const admin = getSupabaseAdmin()

    await admin.from('leads').upsert(
      {
        email: emailRaw,
        risk_level: riskLevel,
        system_name: systemName || null,
        sector: sector || null,
        source: 'assess_page',
      },
      { onConflict: 'email', ignoreDuplicates: false }
    )

    const riskLabels: Record<RiskLevel, string> = {
      PROHIBITED: 'Prohibited',
      HIGH_RISK: 'High Risk',
      LIMITED_RISK: 'Limited Risk',
      MINIMAL_RISK: 'Minimal Risk',
    }
    const riskColors: Record<RiskLevel, string> = {
      PROHIBITED: '#ef4444',
      HIGH_RISK: '#f97316',
      LIMITED_RISK: '#eab308',
      MINIMAL_RISK: '#22c55e',
    }
    const urgencyMap: Record<RiskLevel, string> = {
      PROHIBITED: 'Your AI system may be <strong>prohibited in the EU</strong> under Article 5. You must cease deployment immediately and review whether any modifications can bring it into compliance.',
      HIGH_RISK: 'Your AI system is <strong>high-risk</strong> under the EU AI Act. You have until <strong>August 2, 2026</strong> to complete 12+ compliance obligations, including technical documentation, risk management, and EU database registration.',
      LIMITED_RISK: 'Your AI system has <strong>transparency obligations</strong> under Article 50. Users must be informed they are interacting with AI. These are straightforward to implement but legally required.',
      MINIMAL_RISK: 'Good news, your AI system has <strong>minimal obligations</strong> under the EU AI Act. No mandatory requirements apply, though voluntary codes of conduct are encouraged.',
    }

    const label = riskLabels[riskLevel]
    const color = riskColors[riskLevel]
    const safeName = escapeHtml(systemName)
    const safeSector = escapeHtml(sector)

    await getResend().emails.send({
      from: 'ActComply <hello@getactcomply.com>',
      to: emailRaw,
      subject: `Your EU AI Act assessment result: ${label}${systemName ? `, ${systemName}` : ''}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111">
          <div style="background:#0f172a;padding:24px 32px;border-radius:12px 12px 0 0;display:flex;align-items:center;gap:12px">
            <div style="width:36px;height:36px;background:#3b82f6;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;font-size:14px">AI</div>
            <span style="color:#fff;font-weight:700;font-size:18px">ActComply</span>
          </div>
          <div style="border:1px solid #e2e8f0;border-top:none;padding:32px;border-radius:0 0 12px 12px">
            <p style="color:#475569;margin:0 0 16px;font-size:14px">Your EU AI Act assessment result</p>
            <div style="background:${color}18;border:1px solid ${color}40;border-radius:10px;padding:20px 24px;margin-bottom:24px">
              <div style="font-size:11px;font-weight:600;color:${color};letter-spacing:0.05em;margin-bottom:4px">RISK CLASSIFICATION</div>
              <div style="font-size:28px;font-weight:700;color:${color}">${label}</div>
              ${safeName ? `<div style="font-size:13px;color:#64748b;margin-top:4px">${safeName}${safeSector ? ` · ${safeSector}` : ''}</div>` : ''}
            </div>
            <p style="color:#334155;line-height:1.7;margin:0 0 24px">${urgencyMap[riskLevel]}</p>
            <h3 style="font-size:15px;font-weight:600;margin:0 0 12px">What's next?</h3>
            <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
              ${riskLevel === 'HIGH_RISK' || riskLevel === 'PROHIBITED' ? `
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#475569">✅ Full compliance checklist (27 obligations)</td>
                <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:13px;text-align:right"><a href="https://www.getactcomply.com/eu-ai-act-compliance-checklist" style="color:#3b82f6">View →</a></td>
              </tr>
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#475569">📄 Auto-generate your Article 11 technical docs</td>
                <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:13px;text-align:right"><a href="https://www.getactcomply.com/#pricing" style="color:#3b82f6">Business plan →</a></td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding:8px 0;font-size:13px;color:#475569">🔍 Assess more of your AI systems</td>
                <td style="padding:8px 0;font-size:13px;text-align:right"><a href="https://www.getactcomply.com/assess" style="color:#3b82f6">Free →</a></td>
              </tr>
            </table>
            <div style="background:#f8fafc;border-radius:10px;padding:20px 24px;margin-bottom:24px">
              <div style="font-size:13px;font-weight:600;margin-bottom:8px">⏰ August 2, 2026 deadline</div>
              <div style="font-size:13px;color:#475569;line-height:1.6">Full EU AI Act enforcement begins in under 110 days. High-risk AI systems that aren't compliant face fines up to €30M or 6% of global turnover.</div>
            </div>
            <a href="https://www.getactcomply.com/#pricing" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
              Get your full compliance package →
            </a>
            <p style="margin-top:24px;font-size:11px;color:#94a3b8;line-height:1.6">
              This assessment is for informational purposes only and does not constitute legal advice.<br>
              <a href="https://www.getactcomply.com/privacy" style="color:#94a3b8">Privacy policy</a> · You received this because you used ActComply's free assessment tool.
            </p>
          </div>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    await logError(err, { route: 'POST /api/capture-lead' })
    return NextResponse.json({ success: true })
  }
}
