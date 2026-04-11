import Stripe from 'stripe'

export function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-03-25.dahlia',
  })
}

export const PLANS = {
  starter: {
    name: 'Starter',
    priceId: 'price_1TKvTXAT48riqVkThCksWJD3',
    price: 499,
    currency: 'aud',
    interval: 'month',
    features: [
      'Up to 5 AI systems assessed',
      'Full EU AI Act risk classification',
      'Compliance requirement checklist',
      'Monthly regulatory update alerts',
      'PDF compliance report',
    ],
    limit: 5,
  },
  business: {
    name: 'Business',
    priceId: 'price_1TKvTgAT48riqVkTX67CHfbl',
    price: 1999,
    currency: 'aud',
    interval: 'month',
    features: [
      'Unlimited AI systems assessed',
      'Full EU AI Act risk classification',
      'Auto-generated technical documentation',
      'Conformity assessment templates',
      'Weekly regulatory monitoring alerts',
      'EU database registration guidance',
      'Audit trail for regulators',
      'Priority email support',
    ],
    limit: -1,
  },
  enterprise: {
    name: 'Enterprise',
    priceId: 'price_1TKvTqAT48riqVkTvkqMGsmN',
    price: 4999,
    currency: 'aud',
    interval: 'month',
    features: [
      'Everything in Business',
      'Multi-entity / group management',
      'Custom regulatory monitoring scope',
      'White-label compliance reports',
      'API access to assessment engine',
      'Dedicated compliance dashboard',
      'SLA-backed uptime',
      'Dedicated onboarding support',
    ],
    limit: -1,
  },
}
