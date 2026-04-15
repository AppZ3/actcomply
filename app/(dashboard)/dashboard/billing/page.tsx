import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { getStripe, PLANS } from '@/lib/stripe'

export const metadata: Metadata = {
  title: 'Billing — ActComply',
  description: 'Manage your ActComply plan and payment details.',
}
import { ManageBillingButton } from './manage-button'
import { UpgradeButton } from './upgrade-button'
import { UpgradedBanner } from './upgraded-banner'

const PLAN_FEATURES: Record<string, string[]> = {
  starter: PLANS.starter.features,
  business: PLANS.business.features,
  enterprise: PLANS.enterprise.features,
  free: ['1 AI system assessed', 'Basic risk classification'],
}

const PLAN_PRICE: Record<string, string> = {
  starter:    '€499/month',
  business:   '€1,499/month',
  enterprise: '€2,999/month',
  free:       'Free',
}

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ upgraded?: string }> }) {
  const { upgraded } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, subscription_status, stripe_customer_id, stripe_subscription_id')
    .eq('id', user.id)
    .single()

  const plan = profile?.plan ?? 'free'
  const status = profile?.subscription_status ?? null
  const hasStripe = !!profile?.stripe_customer_id

  // Fetch next billing date from Stripe if available
  let nextBillingDate: string | null = null
  if (profile?.stripe_subscription_id) {
    try {
      const stripe = getStripe()
      const sub = await stripe.subscriptions.retrieve(profile.stripe_subscription_id)
      nextBillingDate = new Date(((sub as unknown) as { current_period_end: number }).current_period_end * 1000)
        .toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    } catch { /* subscription may not exist */ }
  }

  const features = PLAN_FEATURES[plan] ?? []
  const isPaid = plan !== 'free'

  return (
    <div className="p-8 max-w-2xl">
      {upgraded === '1' && <UpgradedBanner plan={plan} />}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-gray-400 text-sm mt-1">Manage your plan and payment details.</p>
      </div>

      {/* Current plan */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Current plan</div>
            <div className="text-xl font-bold capitalize">{plan}</div>
            <div className="text-gray-400 text-sm mt-0.5">{PLAN_PRICE[plan] ?? ''}</div>
          </div>
          <div className="text-right">
            {status && (
              <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
                status === 'active'   ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                status === 'canceled' ? 'bg-gray-500/10 text-gray-400 border-gray-500/20' :
                                        'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
              }`}>
                {status}
              </span>
            )}
            {nextBillingDate && (
              <div className="text-xs text-gray-500 mt-2">Next billing: {nextBillingDate}</div>
            )}
          </div>
        </div>

        <ul className="space-y-1.5 mb-5">
          {features.map(f => (
            <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
              <svg className="w-3.5 h-3.5 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {f}
            </li>
          ))}
        </ul>

        {hasStripe && <ManageBillingButton />}
      </div>

      {/* Upgrade options for non-enterprise */}
      {plan !== 'enterprise' && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="font-semibold mb-4 text-sm">
            {isPaid ? 'Upgrade your plan' : 'Choose a plan'}
          </h2>
          <div className="space-y-3">
            {Object.entries(PLANS)
              .filter(([key]) => key !== plan)
              .map(([key, p]) => (
                <div key={key} className="flex items-center justify-between gap-4 border border-white/10 rounded-lg px-4 py-3">
                  <div>
                    <div className="text-sm font-semibold capitalize">{p.name}</div>
                    <div className="text-xs text-gray-400">€{p.price}/month</div>
                  </div>
                  <UpgradeButton plan={key} />
                </div>
              ))}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-600 mt-6 text-center">
        Questions? Email <a href="mailto:support@getactcomply.com" className="text-gray-500 hover:text-gray-300 transition">support@getactcomply.com</a>
      </p>
    </div>
  )
}
