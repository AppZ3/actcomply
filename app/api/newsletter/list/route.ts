// GET /api/newsletter/list — admin-authed list of recent issues + active
// subscriber count. Powers the composer UI in the outreach-tool, which calls
// this via its /api/newsletter proxy with the NEWSLETTER_ADMIN_SECRET bearer.

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { logError } from '@/lib/error-logger'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const secret = process.env.NEWSLETTER_ADMIN_SECRET
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const admin = getSupabaseAdmin()
    const [issuesRes, subsRes] = await Promise.all([
      admin
        .from('newsletter_issues')
        .select('id, slug, subject, sent_at, sent_count, created_at')
        .order('created_at', { ascending: false })
        .limit(20),
      admin
        .from('newsletter_subscribers')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active'),
    ])

    if (issuesRes.error) throw issuesRes.error
    if (subsRes.error) throw subsRes.error

    return NextResponse.json({
      issues: issuesRes.data ?? [],
      subscriber_count: subsRes.count ?? 0,
    })
  } catch (err) {
    await logError(err, { route: 'GET /api/newsletter/list' })
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
