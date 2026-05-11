// POST /api/billing/portal, create a Stripe customer portal session

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getStripe } from '@/lib/stripe'
import { logError } from '@/lib/error-logger'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ error: 'No billing account found. Please subscribe to a plan first.' }, { status: 404 })
  }

  const stripe = getStripe()
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
    })
    return NextResponse.json({ url: session.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await logError(err, { route: 'POST /api/billing/portal', userId: user.id, userEmail: user.email })
    // If the customer no longer exists in Stripe, clear the stale ID
    if (message.includes('No such customer')) {
      await supabase.from('profiles').update({
        stripe_customer_id: null,
        stripe_subscription_id: null,
        subscription_status: null,
      }).eq('id', user.id)
      return NextResponse.json({ error: 'Billing account not found. Please subscribe to a plan to set up billing.' }, { status: 404 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
