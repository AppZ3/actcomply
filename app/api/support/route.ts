// POST /api/support
// Receives support form submissions and forwards to the outreach tool pipeline

import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/error-logger'

const OUTREACH_URL = 'https://outreach-tool-navy.vercel.app'

export async function POST(req: NextRequest) {
  const { name, email, subject, message } = await req.json()

  if (!message || !email) {
    return NextResponse.json({ error: 'Email and message are required' }, { status: 400 })
  }

  const body = `Name: ${name || 'Unknown'}\nEmail: ${email}\n\n${message}`

  try {
    const res = await fetch(`${OUTREACH_URL}/api/support`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source_email: email,
        subject: subject || 'Support request',
        body,
      }),
    })
    if (!res.ok) return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    await logError(err, { route: 'POST /api/support' })
    return NextResponse.json({ error: 'Failed to submit request. Please email support directly.' }, { status: 500 })
  }
}
