import Stripe from 'stripe'

export function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-03-25.dahlia',
  })
}

export const PLANS = {
  starter: {
    name: 'Starter',
    priceId: process.env.STRIPE_STARTER_PRICE_ID!,
    annualPriceId: process.env.STRIPE_STARTER_ANNUAL_PRICE_ID!,
    price: 499,
    annualPrice: 4990,
    currency: 'eur',
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
    priceId: process.env.STRIPE_BUSINESS_PRICE_ID!,
    annualPriceId: process.env.STRIPE_BUSINESS_ANNUAL_PRICE_ID!,
    price: 1499,
    annualPrice: 14990,
    currency: 'eur',
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
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID!,
    annualPriceId: process.env.STRIPE_ENTERPRISE_ANNUAL_PRICE_ID!,
    price: 2999,
    annualPrice: 29990,
    currency: 'eur',
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
