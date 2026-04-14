// POST /api/billing/checkout — create a Stripe checkout session for a plan upgrade

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getStripe, PLANS } from '@/lib/stripe'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { plan } = await req.json()
  const planConfig = PLANS[plan as keyof typeof PLANS]
  if (!planConfig) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  const stripe = getStripe()
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://getactcomply.com'

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: planConfig.priceId, quantity: 1 }],
    customer: profile?.stripe_customer_id || undefined,
    customer_email: profile?.stripe_customer_id ? undefined : user.email,
    metadata: { user_id: user.id, plan },
    success_url: `${baseUrl}/dashboard/billing?upgraded=1`,
    cancel_url: `${baseUrl}/dashboard/billing`,
  })

  return NextResponse.json({ url: session.url })
}
