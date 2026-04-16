import { NextRequest, NextResponse } from 'next/server'
import { getStripe, PLANS } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { resend } from '@/lib/resend'
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
          // New user — Supabase sends the invite email with a magic link
          const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
            redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback?redirect=/dashboard`,
          })
          if (inviteError) console.error('Invite error:', inviteError.message)
          await new Promise(resolve => setTimeout(resolve, 2000))
        } else {
          // Existing user (e.g. re-purchase / upgrade) — generate a fresh magic link
          // and send it ourselves via Resend so they can access their dashboard.
          const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email,
            options: {
              redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback?redirect=/dashboard`,
            },
          })
          if (linkError) {
            console.error('Generate magic link error:', linkError.message)
          } else {
            const magicLink = linkData?.properties?.action_link
            if (magicLink) {
              await resend.emails.send({
                from: 'ActComply <hello@getactcomply.com>',
                to: email,
                subject: 'Your ActComply subscription is active — sign in here',
                html: `
                  <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111">
                    <div style="background:#0f172a;padding:24px 32px;border-radius:12px 12px 0 0">
                      <span style="color:#fff;font-weight:700;font-size:18px">ActComply</span>
                    </div>
                    <div style="border:1px solid #e2e8f0;border-top:none;padding:32px;border-radius:0 0 12px 12px">
                      <h2 style="margin:0 0 12px;font-size:22px">You're all set</h2>
                      <p style="color:#475569;line-height:1.6;margin:0 0 24px">
                        Your ActComply subscription is now active. Click below to access your compliance dashboard.
                      </p>
                      <a href="${magicLink}" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;display:inline-block">
                        Sign in to dashboard →
                      </a>
                      <p style="margin-top:24px;font-size:12px;color:#94a3b8">
                        This link expires in 24 hours and can only be used once.<br>
                        Questions? Reply to this email or visit
                        <a href="https://getactcomply.com/support" style="color:#94a3b8">getactcomply.com/support</a>
                      </p>
                    </div>
                  </div>
                `,
              })
            }
          }
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
