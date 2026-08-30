import type { Metadata } from 'next'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ThemeToggle'
import { SiteNav } from '@/components/SiteNav'

export const metadata: Metadata = {
  title: 'EU AI Act Compliance Services',
  description:
    'Done-with-you and done-for-you EU AI Act compliance. Classification, technical documentation, and ongoing compliance built on the ActComply platform. Fixed scope, clear turnaround.',
  alternates: { canonical: 'https://www.getactcomply.com/services' },
  openGraph: {
    title: 'EU AI Act Compliance Services | ActComply',
    description:
      'Classification, technical documentation, and ongoing EU AI Act compliance, handled for you on the ActComply platform.',
    url: 'https://www.getactcomply.com/services',
  },
}

type Tier = {
  name: string
  price: string
  priceNote: string
  who: string
  scope: string
  turnaround: string
  revisions: string
  cta: string
  ctaHref: string
  badge?: string
}

const TIERS: Tier[] = [
  {
    name: 'Classification Sprint',
    price: '$3,000',
    priceNote: 'fixed scope',
    who: 'For teams that need to know exactly where they stand before August 2.',
    scope:
      'I inventory your AI systems and classify each one against the Act, then hand you audit-ready ActComply assessments and a plain-language gap report. We close with a 60 minute readout, so you leave knowing what applies, what does not, and what to do first.',
    turnaround: 'One week',
    revisions: 'One revision round on the report',
    cta: 'Book a scoping call',
    ctaHref:
      'mailto:hello@getactcomply.com?subject=Classification%20Sprint%20enquiry',
  },
  {
    name: 'Compliance Build',
    price: '$8,000',
    priceNote: 'fixed scope',
    who: 'For teams that have to be compliant, not just classified.',
    scope:
      'Everything in the Sprint, then I build the obligations that actually apply to you: Article 11 technical documentation, an Article 9 risk management plan, Article 50 transparency measures, and a clear provider versus deployer mapping. Generated in ActComply and tailored to how your systems really work.',
    turnaround: 'Three to four weeks',
    revisions: 'Two revision rounds',
    cta: 'Book a scoping call',
    ctaHref: 'mailto:hello@getactcomply.com?subject=Compliance%20Build%20enquiry',
    badge: 'RECOMMENDED',
  },
  {
    name: 'Compliance Partner',
    price: 'Custom',
    priceNote: 'retainer',
    who: 'For organisations that want this handled on an ongoing basis.',
    scope:
      'A working retainer. I keep your classifications current as systems change, run model-change re-assessments, maintain incident logging and post-market monitoring, and review everything each quarter. Multi-entity support and a Business ActComply seat are included.',
    turnaround: 'Ongoing, with an agreed response time',
    revisions: 'Continuous',
    cta: 'Talk to me',
    ctaHref:
      'mailto:hello@getactcomply.com?subject=Compliance%20Partner%20enquiry',
  },
]

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-white">
      {/* Nav */}
      <SiteNav width="6xl">
        <Link href="/#pricing" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition">Pricing</Link>
        <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition">Sign in</Link>
        <Link href="/assess" className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-3 py-2 rounded-lg transition">
          Assess your AI free
        </Link>
        <ThemeToggle />
      </SiteNav>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-24 pb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
          Done with you, or done for you
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          ActComply gives you the platform. When you would rather have the work handled, these are the ways we can do it together. Every engagement runs on the same tooling, so you get audit-ready output faster than a generalist consultant can scope the project.
        </p>
      </section>

      {/* Tiers */}
      <section className="max-w-6xl mx-auto px-6 pb-12">
        <div className="grid md:grid-cols-3 gap-8 items-stretch">
          {TIERS.map((tier, i) => (
            <div
              key={tier.name}
              className={`rounded-2xl p-8 border flex flex-col ${
                i === 1
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-white border-gray-200 dark:bg-white/5 dark:border-white/10'
              }`}
            >
              {tier.badge && (
                <div className="text-xs font-semibold bg-white/20 text-white px-3 py-1 rounded-full inline-block self-start mb-4">
                  {tier.badge}
                </div>
              )}
              <h2 className="text-xl font-bold mb-2">{tier.name}</h2>
              <div className="text-4xl font-bold mb-1">
                {tier.price}
                <span className="text-base font-normal opacity-70"> {tier.priceNote}</span>
              </div>
              <p className={`text-sm font-medium mb-5 ${i === 1 ? 'text-blue-100' : 'text-gray-900 dark:text-white'}`}>
                {tier.who}
              </p>
              <p className={`text-sm leading-relaxed mb-6 flex-1 ${i === 1 ? 'text-blue-50' : 'text-gray-600 dark:text-gray-400'}`}>
                {tier.scope}
              </p>
              <div className={`text-sm space-y-1 mb-6 ${i === 1 ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                <div><span className="font-semibold">Turnaround:</span> {tier.turnaround}</div>
                <div><span className="font-semibold">Revisions:</span> {tier.revisions}</div>
              </div>
              <a
                href={tier.ctaHref}
                className={`w-full text-center font-semibold py-3 rounded-xl transition mt-auto ${
                  i === 1
                    ? 'bg-white text-blue-600 hover:bg-blue-50'
                    : 'bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-gray-900 dark:text-white'
                }`}
              >
                {tier.cta}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Self-serve handoff */}
      <section className="max-w-3xl mx-auto px-6 pb-24 text-center">
        <p className="text-gray-600 dark:text-gray-400">
          Prefer to do it yourself? The platform handles classification and documentation on its own.{' '}
          <Link href="/#pricing" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
            See self-serve pricing
          </Link>
          , or{' '}
          <Link href="/assess" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
            assess a system free
          </Link>
          .
        </p>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-white/10 px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <div>© 2026 ActComply. Built to make AI trustworthy.</div>
          <div className="flex flex-wrap justify-center gap-6">
            <Link href="/services" className="hover:text-gray-700 dark:hover:text-gray-300 transition">Services</Link>
            <Link href="/support" className="hover:text-gray-700 dark:hover:text-gray-300 transition">Support</Link>
            <Link href="/terms" className="hover:text-gray-700 dark:hover:text-gray-300 transition">Terms</Link>
            <Link href="/privacy" className="hover:text-gray-700 dark:hover:text-gray-300 transition">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
