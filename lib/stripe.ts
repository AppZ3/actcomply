import Stripe from 'stripe'

export function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-03-25.dahlia',
  })
}

export type PlanKey = 'free' | 'starter' | 'business' | 'enterprise'

export interface PlanFeatures {
  systemsLimit: number        // -1 = unlimited
  techDocsEnabled: boolean    // auto-generated Article 11 documentation
  auditTrailEnabled: boolean  // full audit log for regulators
  alertFrequency: 'none' | 'monthly' | 'weekly'
  apiAccess: boolean          // API access to assessment engine
  whiteLabel: boolean         // white-label compliance reports
  multiEntity: boolean        // manage multiple legal entities
}

export const PLAN_FEATURES: Record<PlanKey, PlanFeatures> = {
  free: {
    systemsLimit: 1,
    techDocsEnabled: false,
    auditTrailEnabled: false,
    alertFrequency: 'none',
    apiAccess: false,
    whiteLabel: false,
    multiEntity: false,
  },
  starter: {
    systemsLimit: 5,
    techDocsEnabled: false,
    auditTrailEnabled: false,
    alertFrequency: 'monthly',
    apiAccess: false,
    whiteLabel: false,
    multiEntity: false,
  },
  business: {
    systemsLimit: -1,
    techDocsEnabled: true,
    auditTrailEnabled: true,
    alertFrequency: 'weekly',
    apiAccess: false,
    whiteLabel: false,
    multiEntity: false,
  },
  enterprise: {
    systemsLimit: -1,
    techDocsEnabled: true,
    auditTrailEnabled: true,
    alertFrequency: 'weekly',
    apiAccess: true,
    whiteLabel: true,
    multiEntity: true,
  },
}

export function getPlanFeatures(plan: string | null | undefined): PlanFeatures {
  return PLAN_FEATURES[(plan as PlanKey) ?? 'free'] ?? PLAN_FEATURES.free
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
