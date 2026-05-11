import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getResend } from '@/lib/resend'
import { logError } from '@/lib/error-logger'

export async function POST(req: NextRequest) {
  try {
    const { email, riskLevel, systemName, sector } = await req.json()
    if (!email || !riskLevel) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const admin = getSupabaseAdmin()

    await admin.from('leads').upsert(
      { email: email.toLowerCase().trim(), risk_level: riskLevel, system_name: systemName, sector, source: 'assess_page' },
      { onConflict: 'email', ignoreDuplicates: false }
    )

    const riskLabels: Record<string, string> = {
      PROHIBITED: 'Prohibited',
      HIGH_RISK: 'High Risk',
      LIMITED_RISK: 'Limited Risk',
      MINIMAL_RISK: 'Minimal Risk',
    }
    const riskColors: Record<string, string> = {
      PROHIBITED: '#ef4444',
      HIGH_RISK: '#f97316',
      LIMITED_RISK: '#eab308',
      MINIMAL_RISK: '#22c55e',
    }

    const label = riskLabels[riskLevel] ?? riskLevel
    const color = riskColors[riskLevel] ?? '#3b82f6'

    const urgencyMap: Record<string, string> = {
      PROHIBITED: 'Your AI system may be <strong>prohibited in the EU</strong> under Article 5. You must cease deployment immediately and review whether any modifications can bring it into compliance.',
      HIGH_RISK: 'Your AI system is <strong>high-risk</strong> under the EU AI Act. You have until <strong>August 2, 2026</strong> to complete 12+ compliance obligations, including technical documentation, risk management, and EU database registration.',
      LIMITED_RISK: 'Your AI system has <strong>transparency obligations</strong> under Article 50. Users must be informed they are interacting with AI. These are straightforward to implement but legally required.',
      MINIMAL_RISK: 'Good news, your AI system has <strong>minimal obligations</strong> under the EU AI Act. No mandatory requirements apply, though voluntary codes of conduct are encouraged.',
    }

    await getResend().emails.send({
      from: 'ActComply <hello@getactcomply.com>',
      to: email,
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
              ${systemName ? `<div style="font-size:13px;color:#64748b;margin-top:4px">${systemName}${sector ? ` · ${sector}` : ''}</div>` : ''}
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
    return NextResponse.json({ success: true }) // don't fail the user flow even if email/DB fails
  }
}
