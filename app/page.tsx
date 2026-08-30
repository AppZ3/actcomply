'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { PLANS } from '@/lib/stripe'
import { ThemeToggle } from '@/components/ThemeToggle'
import { NewsletterSignup } from '@/components/NewsletterSignup'
import { RelatedGuides } from '@/components/RelatedGuides'
import { SiteNav } from '@/components/SiteNav'
import { createClient } from '@/lib/supabase'

// Shape of /api/stats.nextMilestone. Server source of truth is
// ENFORCEMENT_MILESTONES in lib/eu-ai-act.ts.
interface NextMilestone {
  key: string
  label: string
  displayDate: string
  daysUntil: number
}

// Mirrors lib/eu-ai-act.ts so the hero still shows a real date if /api/stats
// fails. Kept inline rather than imported so the rules engine constants stay
// out of the landing page bundle. Update both together.
const MILESTONE_FALLBACK: { key: string; iso: string; label: string; displayDate: string }[] = [
  { key: 'enforcement', iso: '2026-08-02T00:00:00Z', label: 'Until enforcement powers go live', displayDate: '2 August 2026' },
  { key: 'annex-iii', iso: '2027-12-02T00:00:00Z', label: 'Until Annex III high-risk obligations', displayDate: '2 December 2027' },
  { key: 'annex-i', iso: '2028-08-02T00:00:00Z', label: 'Until Annex I embedded-product obligations', displayDate: '2 August 2028' },
]

function nextMilestoneFallback(): NextMilestone | null {
  const now = Date.now()
  const next = MILESTONE_FALLBACK.find(m => new Date(m.iso).getTime() > now)
  if (!next) return null
  return {
    key: next.key,
    label: next.label,
    displayDate: next.displayDate,
    daysUntil: Math.ceil((new Date(next.iso).getTime() - now) / 86_400_000),
  }
}

async function startCheckout(plan: string, annual: boolean) {
  const res = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan, annual }),
  })
  const data = await res.json()
  if (data.url) window.location.href = data.url
  else alert('Checkout error: ' + (data.error || 'Unknown error'))
}

export default function LandingPage() {
  const [annual, setAnnual] = useState(false)
  const [nextMilestone, setNextMilestone] = useState<NextMilestone | null>(null)
  const [requirementsMapped, setRequirementsMapped] = useState<number | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    createClient().auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session)
    })
  }, [])

  // Handle Supabase auth redirects that land on homepage
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code')
    if (code) {
      window.location.replace(`/auth/callback?code=${code}`)
      return
    }
    if (window.location.hash.includes('access_token=')) {
      window.location.replace(`/auth/callback${window.location.hash}`)
    }
  }, [])

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/stats')
        const data = await res.json()
        setNextMilestone(data.nextMilestone ?? null)
        setRequirementsMapped(data.requirementsMapped)
      } catch {
        setNextMilestone(nextMilestoneFallback())
      }
    }
    fetchStats()
    const interval = setInterval(fetchStats, 60_000)
    return () => clearInterval(interval)
  }, [])

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://www.getactcomply.com/#organization',
        name: 'ActComply',
        url: 'https://www.getactcomply.com',
        description: 'EU AI Act compliance platform for organisations operating AI systems in the European Union.',
        contactPoint: { '@type': 'ContactPoint', email: 'support@getactcomply.com', contactType: 'customer support' },
      },
      {
        '@type': 'SoftwareApplication',
        '@id': 'https://www.getactcomply.com/#product',
        name: 'ActComply',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        url: 'https://www.getactcomply.com',
        description: 'Automated EU AI Act compliance platform. Risk classification, compliance checklists, and audit-ready documentation for AI systems.',
        offers: {
          '@type': 'AggregateOffer',
          priceCurrency: 'EUR',
          lowPrice: '49',
          highPrice: '299',
          offerCount: '3',
        },
      },
      {
        '@type': 'WebPage',
        '@id': 'https://www.getactcomply.com/#webpage',
        url: 'https://www.getactcomply.com',
        name: 'ActComply: EU AI Act Compliance Platform',
        description: 'Assess your AI systems against the EU AI Act. Risk classification, compliance roadmap, and audit-ready documentation.',
        isPartOf: { '@id': 'https://www.getactcomply.com/#organization' },
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'What is the EU AI Act enforcement deadline?',
            acceptedAnswer: { '@type': 'Answer', text: 'EU AI Act enforcement powers went live on 2 August 2026 and are in force now. Prohibited AI practices and GPAI provider obligations have been enforceable since that date, and organisations were required to have completed their AI inventory and risk classification by then. Under the May 2026 Omnibus provisional agreement (pending formal adoption), full obligations for high-risk AI systems (Annex III) apply from 2 December 2027, and for AI embedded in regulated products (Annex I) from 2 August 2028.' },
          },
          {
            '@type': 'Question',
            name: 'What are the fines for non-compliance with the EU AI Act?',
            acceptedAnswer: { '@type': 'Answer', text: 'Fines for prohibited AI practices can reach €35 million or 7% of global annual turnover, whichever is higher. High-risk AI non-compliance can result in fines of €30 million or 6% of global turnover.' },
          },
          {
            '@type': 'Question',
            name: 'Which AI systems are considered high-risk under the EU AI Act?',
            acceptedAnswer: { '@type': 'Answer', text: 'High-risk AI systems include those used in biometric identification, critical infrastructure, education, employment/HR, credit scoring, law enforcement, migration/asylum decisions, and administration of justice.' },
          },
          {
            '@type': 'Question',
            name: 'How long does an EU AI Act compliance assessment take?',
            acceptedAnswer: { '@type': 'Answer', text: 'ActComply can assess your AI system in under 5 minutes. Simply describe what your AI does, who it affects, and what sector it operates in to receive an instant risk classification with article references.' },
          },
        ],
      },
    ],
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Nav */}
      <SiteNav width="6xl" brandHref={null}>
        <Link href="#pricing" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition">Pricing</Link>
        <Link href="/services" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition">Services</Link>
        {isLoggedIn
          ? <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition">Dashboard</Link>
          : <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition">Sign in</Link>
        }
        <Link href="/assess" className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-2 py-2 rounded-lg transition">
          Check Your AI Systems
        </Link>
        <ThemeToggle />
      </SiteNav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-28 text-center">
        <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-sm px-4 py-2 rounded-full mb-8">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          Enforcement powers are live. Prohibited AI and GPAI obligations apply now
        </div>

        <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
          Enforcement is live.<br />
          <span className="text-blue-500 dark:text-blue-400">Is your AI compliant?</span>
        </h1>

        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10">
          The deadline has passed. ActComply assesses your AI systems against the EU AI Act,
          generates the documentation regulators ask for, and keeps you current as obligations
          phase in to 2 December 2027. Fines reach <span className="text-gray-900 dark:text-white font-semibold">€35M or 7% of global turnover.</span>
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/assess"
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-4 rounded-xl text-lg transition"
          >
            Assess your AI systems free →
          </Link>
          <Link
            href="#how-it-works"
            className="border border-gray-300 hover:border-gray-400 dark:border-white/20 dark:hover:border-white/40 text-gray-900 dark:text-white font-semibold px-8 py-4 rounded-xl text-lg transition"
          >
            See how it works
          </Link>
        </div>

        <p className="text-sm text-gray-500 mt-4">No credit card required for free assessment</p>
      </section>

      {/* Stats */}
      <section className="border-y border-gray-200 dark:border-white/10 py-12 bg-white dark:bg-transparent">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '€35M', label: 'Maximum fine per violation' },
            { value: '7%', label: 'Of global turnover at risk' },
            {
              value: nextMilestone !== null ? `${nextMilestone.daysUntil} days` : '-- days',
              label: nextMilestone !== null ? nextMilestone.label : 'Until the next compliance deadline',
              live: true,
            },
            { value: requirementsMapped !== null ? `${requirementsMapped}+` : '15+', label: 'Compliance requirements mapped', live: true },
          ].map(stat => (
            <div key={stat.label}>
              <div className="text-3xl font-bold text-blue-500 dark:text-blue-400 mb-1 tabular-nums">
                {stat.value}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1.5">
                {stat.live && nextMilestone !== null && (
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shrink-0" />
                )}
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-6 py-24">
        <h2 className="text-3xl font-bold text-center mb-4">Compliance in three steps</h2>
        <p className="text-gray-600 dark:text-gray-400 text-center mb-16">No lawyers. No consultants. Automated, accurate, ongoing.</p>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: '01',
              title: 'Describe your AI systems',
              description: 'Tell us what your AI does, who it affects, and what sector it operates in. Takes under 5 minutes per system.',
            },
            {
              step: '02',
              title: 'Get instant risk classification',
              description: 'Our engine classifies each system under the EU AI Act (Prohibited, High-Risk, Limited Risk, or Minimal Risk) with exact article references.',
            },
            {
              step: '03',
              title: 'Receive your compliance roadmap',
              description: 'Get a prioritised action plan, auto-generated documentation templates, and ongoing alerts when regulations change.',
            },
          ].map(item => (
            <div key={item.step} className="bg-white border border-gray-200 dark:bg-white/5 dark:border-white/10 rounded-2xl p-8">
              <div className="text-4xl font-bold text-blue-500/20 dark:text-blue-500/30 mb-4">{item.step}</div>
              <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
              <p className="text-gray-600 dark:text-gray-400">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 py-24">
        <h2 className="text-3xl font-bold text-center mb-4">Simple pricing</h2>
        <p className="text-gray-600 dark:text-gray-400 text-center mb-8">Cheaper than one hour of compliance consulting. Cancel anytime.</p>

        {/* Billing toggle */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          <span className={`text-sm ${!annual ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>Monthly</span>
          <button
            onClick={() => setAnnual(v => !v)}
            className={`relative shrink-0 w-12 h-6 rounded-full transition-colors ${annual ? 'bg-blue-600' : 'bg-gray-300 dark:bg-white/20'}`}
          >
            <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${annual ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
          <span className={`text-sm ${annual ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
            Annual <span className="text-green-600 dark:text-green-400 font-semibold">2 months free</span>
          </span>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {Object.entries(PLANS).map(([key, plan], i) => {
            const displayPrice = annual ? plan.annualPrice : plan.price
            const perLabel = annual ? '/year' : '/mo'
            return (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 border flex flex-col ${
                  i === 1
                    ? 'bg-blue-600 border-blue-500'
                    : 'bg-white border-gray-200 dark:bg-white/5 dark:border-white/10'
                }`}
              >
                {i === 1 && (
                  <div className="text-xs font-semibold bg-white/20 text-white px-3 py-1 rounded-full inline-block mb-4">
                    MOST POPULAR
                  </div>
                )}
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="text-4xl font-bold mb-1">
                  €{displayPrice.toLocaleString()}
                  <span className="text-lg font-normal opacity-70">{perLabel}</span>
                </div>
                {annual && (
                  <p className={`text-xs mb-1 ${i === 1 ? 'text-blue-200' : 'text-green-600 dark:text-green-400'}`}>
                    €{plan.price}/mo billed annually
                  </p>
                )}
                <p className={`text-sm mb-6 ${i === 1 ? 'text-blue-100' : 'text-gray-600 dark:text-gray-400'}`}>
                  {plan.limit === -1 ? 'Unlimited AI systems' : `Up to ${plan.limit} AI systems`}
                </p>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <span className={i === 1 ? 'text-blue-200' : 'text-blue-500 dark:text-blue-400'}>✓</span>
                      <span className={i === 1 ? 'text-blue-50' : 'text-gray-700 dark:text-gray-300'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => startCheckout(key, annual)}
                  className={`w-full font-semibold py-3 rounded-xl transition cursor-pointer mt-auto ${
                    i === 1
                      ? 'bg-white text-blue-600 hover:bg-blue-50'
                      : 'bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-gray-900 dark:text-white'
                  }`}
                >
                  Get started
                </button>
              </div>
            )
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-16 text-center">
        <div className="bg-blue-600/10 border border-blue-500/20 rounded-3xl p-16">
          <h2 className="text-3xl font-bold mb-4">Don&apos;t wait until August</h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto mb-8">
            High-risk AI systems require months of documentation work. Start your compliance assessment today. It takes 5 minutes.
          </p>
          <Link
            href="/assess"
            className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-semibold px-10 py-4 rounded-xl text-lg transition"
          >
            Start free assessment →
          </Link>
        </div>
      </section>

      {/* EU AI Act guides */}
      <section className="px-6 py-12 max-w-6xl mx-auto">
        <RelatedGuides />
      </section>

      {/* Newsletter */}
      <section className="px-6 py-12 max-w-2xl mx-auto">
        <NewsletterSignup
          source="homepage-footer"
          variant="card"
          heading="Practitioner briefs on the EU AI Act"
          subheading="One short email when there's something Heads of Legal, Compliance, and AI should know. Unsubscribe in one click."
        />
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-white/10 px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <div>© 2026 ActComply. Built to make AI trustworthy.</div>
          <div className="flex flex-wrap justify-center gap-6">
            <Link href="/eu-ai-act-compliance-checklist" className="hover:text-gray-700 dark:hover:text-gray-300 transition">Compliance Checklist</Link>
            <Link href="/eu-ai-act-high-risk-ai-systems" className="hover:text-gray-700 dark:hover:text-gray-300 transition">High-Risk AI Systems</Link>
            <Link href="/eu-ai-act-risk-classification" className="hover:text-gray-700 dark:hover:text-gray-300 transition">Risk Classification</Link>
            <Link href="/support" className="hover:text-gray-700 dark:hover:text-gray-300 transition">Support</Link>
            <Link href="/terms" className="hover:text-gray-700 dark:hover:text-gray-300 transition">Terms</Link>
            <Link href="/privacy" className="hover:text-gray-700 dark:hover:text-gray-300 transition">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
