import { NextRequest, NextResponse } from 'next/server'
import { getStripe, PLANS } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase-admin'
import type Stripe from 'stripe'

const PRICE_TO_PLAN: Record<string, { plan: string; limit: number }> = {
  [PLANS.starter.priceId]:          { plan: 'starter',    limit: PLANS.starter.limit },
  [PLANS.starter.annualPriceId]:    { plan: 'starter',    limit: PLANS.starter.limit },
  [PLANS.business.priceId]:         { plan: 'business',   limit: PLANS.business.limit },
  [PLANS.business.annualPriceId]:   { plan: 'business',   limit: PLANS.business.limit },
  [PLANS.enterprise.priceId]:       { plan: 'enterprise', limit: PLANS.enterprise.limit },
  [PLANS.enterprise.annualPriceId]: { plan: 'enterprise', limit: PLANS.enterprise.limit },
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  const stripe = getStripe()
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Invalid signature'
    console.error('Webhook signature failed:', msg)
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const email = (session.customer_details?.email ?? session.customer_email ?? '').toLowerCase()
        const customerId = session.customer as string
        const subscriptionId = session.subscription as string
        const planKey = session.metadata?.plan
        const userId = session.metadata?.user_id ?? null
        const planData = planKey ? PRICE_TO_PLAN[PLANS[planKey as keyof typeof PLANS]?.priceId] : null

        const profileUpdate = {
          plan: planData?.plan ?? 'starter',
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          subscription_status: 'active',
          systems_limit: planData?.limit ?? 5,
          updated_at: new Date().toISOString(),
        }

        // Prefer direct user_id lookup (logged-in upgrade path)
        if (userId) {
          await supabaseAdmin.from('profiles').update(profileUpdate).eq('id', userId)
          break
        }

        // Fallback: email lookup (new customer from landing page)
        if (!email) {
          console.error('No email or user_id in checkout session')
          break
        }

        const { data: existingProfile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .ilike('email', email)
          .single()

        if (!existingProfile) {
          const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
            redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?redirect=/dashboard`,
          })
          if (inviteError) console.error('Invite error:', inviteError.message)
          await new Promise(resolve => setTimeout(resolve, 2000))
        }

        await supabaseAdmin.from('profiles').update(profileUpdate).ilike('email', email)
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const priceId = sub.items.data[0]?.price.id
        const planData = priceId ? PRICE_TO_PLAN[priceId] : null

        await supabaseAdmin
          .from('profiles')
          .update({
            subscription_status: sub.status,
            plan: planData?.plan ?? 'starter',
            systems_limit: planData?.limit ?? 5,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', sub.id)
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await supabaseAdmin
          .from('profiles')
          .update({
            plan: 'free',
            subscription_status: 'canceled',
            stripe_subscription_id: null,
            systems_limit: 1,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', sub.id)
        break
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err)
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
