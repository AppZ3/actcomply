// POST /api/billing/checkout — unified Stripe checkout for all entry points
// Works for logged-in users (dashboard upgrade) and anonymous users (landing page)

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getStripe, PLANS } from '@/lib/stripe'
import { logError } from '@/lib/error-logger'

export async function POST(req: Request) {
  const { plan, annual } = await req.json()
  const planConfig = PLANS[plan as keyof typeof PLANS]
  if (!planConfig) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

  const priceId = annual ? planConfig.annualPriceId : planConfig.priceId
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://getactcomply.com'
  const stripe = getStripe()

  // Try to get logged-in user for a better checkout experience
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let customerId: string | undefined
  let customerEmail: string | undefined
  let userId: string | undefined

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    customerId = profile?.stripe_customer_id || undefined
    customerEmail = customerId ? undefined : user.email
    userId = user.id
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer: customerId,
      customer_email: customerEmail,
      billing_address_collection: 'required',
      automatic_tax: { enabled: true },
      metadata: { plan, ...(userId ? { user_id: userId } : {}) },
      success_url: user
        ? `${baseUrl}/dashboard/billing?upgraded=1`
        : `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: user ? `${baseUrl}/dashboard/billing` : `${baseUrl}/cancel`,
    })
    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe checkout error:', err)
    await logError(err, { route: 'POST /api/billing/checkout', userId: userId, context: { plan } })
    return NextResponse.json({ error: 'Failed to create checkout session. Please try again.' }, { status: 500 })
  }
}
