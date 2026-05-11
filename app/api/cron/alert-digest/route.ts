// GET /api/cron/alert-digest, weekly digest of unread regulatory alerts
// Called by Vercel Cron. Protected by CRON_SECRET.

export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getPlanFeatures } from '@/lib/stripe'
import { logError } from '@/lib/error-logger'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const admin = getSupabaseAdmin()

    // Fetch all active paid users
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, email, plan')
      .eq('subscription_status', 'active')
      .neq('plan', 'free')

    if (!profiles?.length) return NextResponse.json({ sent: 0 })

    // Fetch all alerts published in the last 7 days
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 7)
    const { data: recentAlerts } = await admin
      .from('regulatory_alerts')
      .select('id, title, summary, article_refs, severity, published_at')
      .gte('published_at', cutoff.toISOString())
      .order('published_at', { ascending: false })

    if (!recentAlerts?.length) return NextResponse.json({ sent: 0, reason: 'no recent alerts' })

    // Fetch all reads for the recent alert IDs
    const alertIds = recentAlerts.map(a => a.id)
    const { data: allReads } = await admin
      .from('alert_reads')
      .select('user_id, alert_id')
      .in('alert_id', alertIds)

    const readsByUser = new Map<string, Set<string>>()
    for (const r of allReads ?? []) {
      if (!readsByUser.has(r.user_id)) readsByUser.set(r.user_id, new Set())
      readsByUser.get(r.user_id)!.add(r.alert_id)
    }

    const { sendAlertDigestEmail } = await import('@/lib/resend')
    let sent = 0

    for (const profile of profiles) {
      const features = getPlanFeatures(profile.plan)
      if (features.alertFrequency === 'none') continue

      const readSet = readsByUser.get(profile.id) ?? new Set()
      const unread = recentAlerts.filter(a => !readSet.has(a.id))

      // Monthly plan users only get digest if there are 3+ unread (don't spam for 1 minor alert)
      if (features.alertFrequency === 'monthly' && unread.length < 3) continue
      if (unread.length === 0) continue

      try {
        await sendAlertDigestEmail({ to: profile.email, alerts: unread })
        sent++
      } catch {
        // Individual send failure, continue with others
      }
    }

    return NextResponse.json({ sent })
  } catch (err) {
    await logError(err, { route: 'GET /api/cron/alert-digest' })
    return NextResponse.json({ error: 'Digest failed' }, { status: 500 })
  }
}
