import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'

export async function POST() {
  const priceId = process.env.STRIPE_STARTER_TEST_PRICE_ID

  if (!priceId) {
    return NextResponse.json({ error: 'STRIPE_STARTER_TEST_PRICE_ID not set' }, { status: 500 })
  }

  const stripe = getStripe()
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://getactcomply.com'

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/test-buy`,
    billing_address_collection: 'required',
    automatic_tax: { enabled: true },
    metadata: { plan: 'starter' },
  })

  return NextResponse.json({ url: session.url })
}
