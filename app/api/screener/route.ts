export const maxDuration = 30

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getResend } from '@/lib/resend'
import { computeRisk, type ScreenerAnswers } from '@/lib/screener'
import { logError } from '@/lib/error-logger'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.getactcomply.com'
const OUTREACH_TOOL_URL = process.env.OUTREACH_TOOL_URL || 'https://outreach-tool-navy.vercel.app'
const SCREENER_WEBHOOK_SECRET = process.env.SCREENER_WEBHOOK_SECRET

// Rate limiting: 5 submissions per IP per hour
const rateLimitMap = new Map<string, { count: number; windowStart: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const WINDOW = 60 * 60 * 1000
  const entry = rateLimitMap.get(ip)
  if (!entry || now - entry.windowStart > WINDOW) {
    rateLimitMap.set(ip, { count: 1, windowStart: now })
    if (rateLimitMap.size > 2000) {
      for (const [k, v] of rateLimitMap) if (now - v.windowStart > WINDOW) rateLimitMap.delete(k)
    }
    return true
  }
  if (entry.count >= 5) return false
  entry.count++
  return true
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Honeypot: if _hp field is filled, silently succeed (don't process)
  if (body._hp) {
    return NextResponse.json({ tier: 'limited', obligations: [], clause_paragraph: '', lead_id: 'hp', urgency_note: '' })
  }

  // Validate email if provided
  const email = typeof body.email === 'string' ? body.email.toLowerCase().trim() : undefined
  if (email && !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  const answers: ScreenerAnswers = {
    sector: body.sector as ScreenerAnswers['sector'],
    decisions_people: body.decisions_people === true ? true : body.decisions_people === false ? false : null,
    people_per_month: body.people_per_month as ScreenerAnswers['people_per_month'],
    eu_jurisdiction: body.eu_jurisdiction as ScreenerAnswers['eu_jurisdiction'],
    deployment_stage: body.deployment_stage as ScreenerAnswers['deployment_stage'],
    compliance_work_done: body.compliance_work_done as ScreenerAnswers['compliance_work_done'],
  }

  const risk = computeRisk(answers)
  const consent = body.consent === true && !!email

  // Generate Claude paragraph
  let clause_paragraph = ''
  try {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `Write a 3-sentence plain-English paragraph for a ${answers.sector} company whose AI system ${answers.decisions_people ? 'makes decisions affecting people' : 'processes data'}, deployed at scale of ${answers.people_per_month} people/month. Explain what the EU AI Act requires of them and why the August 2, 2026 deadline matters specifically for their situation. Tone: direct and factual. No em dashes. No bullet points.`,
      }],
    })
    if (msg.content[0].type === 'text') clause_paragraph = msg.content[0].text
  } catch (e) {
    logError(e, { route: 'POST /api/screener#claude' }).catch(() => {})
  }

  // Save to screener_leads
  const admin = getSupabaseAdmin()
  const companyName = email ? email.split('@')[1]?.split('.')[0] ?? null : null

  const { data: lead, error: saveErr } = await admin
    .from('screener_leads')
    .upsert({
      email: email ?? `anon-${Date.now()}@noemail.invalid`,
      sector: answers.sector,
      decisions_people: answers.decisions_people,
      people_per_month: answers.people_per_month,
      eu_jurisdiction: answers.eu_jurisdiction,
      deployment_stage: answers.deployment_stage,
      compliance_work_done: answers.compliance_work_done,
      risk_tier: risk.tier,
      annex_iii_category: risk.annex_iii_category,
      source: (body.utm_source as string) || null,
      partner_ref: (body.ref as string) || null,
      consent,
      company_name: companyName,
    }, { onConflict: 'email', ignoreDuplicates: false })
    .select('id')
    .single()

  if (saveErr) logError(saveErr, { route: 'POST /api/screener#save' }).catch(() => {})
  const lead_id = lead?.id ?? 'unknown'

  // Send Day 0 follow-up email if email + consent
  if (email && consent) {
    try {
      await getResend().emails.send({
        from: 'ActComply <hello@getactcomply.com>',
        to: email,
        subject: `Your EU AI Act risk result: ${risk.tier === 'high' ? 'High Risk' : 'Limited Risk'}`,
        html: screenerDay0Html({ email, risk, answers, appUrl: APP_URL }),
      })
      await admin.from('screener_leads').update({ follow_up_day0_sent: true }).eq('id', lead_id)
    } catch (e) {
      logError(e, { route: 'POST /api/screener#day0_email' }).catch(() => {})
    }
  }

  // Real-time notification to Zac
  if (email) {
    try {
      await getResend().emails.send({
        from: 'ActComply Alerts <alerts@getactcomply.com>',
        to: 'zac@getactcomply.com',
        subject: `New screener lead: ${companyName ?? email}, ${risk.tier} risk`,
        html: `<p><strong>Email:</strong> ${email}</p><p><strong>Sector:</strong> ${answers.sector}</p><p><strong>Risk tier:</strong> ${risk.tier}</p><p><strong>Deployment:</strong> ${answers.deployment_stage}</p><p><strong>Consent:</strong> ${consent ? 'Yes' : 'No'}</p>`,
      })
    } catch (e) {
      logError(e, { route: 'POST /api/screener#zac_notify' }).catch(() => {})
    }
  }

  // Sync contact to outreach tool (non-blocking)
  if (email) {
    fetch(`${OUTREACH_TOOL_URL}/api/contacts/screener-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': SCREENER_WEBHOOK_SECRET ?? '',
      },
      body: JSON.stringify({
        email,
        company: companyName ?? '',
        sector: answers.sector,
        risk_tier: risk.tier,
        source: 'screener',
      }),
    }).catch(e => logError(e, { route: 'POST /api/screener#sync' }).catch(() => {}))
  }

  return NextResponse.json({ ...risk, clause_paragraph, lead_id })
}

function screenerDay0Html({ email, risk, answers, appUrl }: {
  email: string
  risk: ReturnType<typeof computeRisk>
  answers: ScreenerAnswers
  appUrl: string
}): string {
  const tierLabel = risk.tier === 'high' ? 'High Risk' : 'Limited Risk'
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111">
      <div style="background:#0f172a;padding:24px 32px;border-radius:12px 12px 0 0">
        <span style="color:#fff;font-weight:700;font-size:18px">ActComply</span>
      </div>
      <div style="padding:32px;background:#fff;border-radius:0 0 12px 12px;border:1px solid #e2e8f0">
        <h2 style="margin:0 0 16px">Your EU AI Act Risk Result: ${tierLabel}</h2>
        ${risk.annex_iii_category ? `<p style="color:#64748b;font-size:14px">${risk.annex_iii_category}</p>` : ''}
        <p>${risk.urgency_note}</p>
        <h3>Your top 3 compliance obligations:</h3>
        <ol>
          ${risk.obligations.map(o => `<li style="margin-bottom:8px">${o}</li>`).join('')}
        </ol>
        <p>Your free trial pre-loads everything mapped to your specific answers. No card required.</p>
        <a href="${appUrl}/signup?email=${encodeURIComponent(email)}&sector=${encodeURIComponent(answers.sector)}&risk=${risk.tier}" style="display:inline-block;background:#0f172a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px">
          Start your free trial
        </a>
        <p style="color:#94a3b8;font-size:12px;margin-top:32px">ActComply, getactcomply.com. <a href="${appUrl}/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}">Unsubscribe</a></p>
      </div>
    </div>
  `
}
