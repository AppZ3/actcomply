import Link from 'next/link'
import type { Metadata } from 'next'
import { ThemeToggle } from '@/components/ThemeToggle'
import { RelatedGuides } from '@/components/RelatedGuides'
import { SiteNav } from '@/components/SiteNav'

export const metadata: Metadata = {
  title: 'EU AI Act Risk Classification: 4 Tiers Explained',
  description: 'Understand the EU AI Act four-tier risk classification system: Prohibited, High-Risk, Limited Risk, and Minimal Risk. Find out which tier your AI system falls under.',
  alternates: { canonical: 'https://www.getactcomply.com/eu-ai-act-risk-classification' },
  openGraph: {
    title: 'EU AI Act Risk Classification: 4 Tiers Explained',
    description: 'Prohibited, High-Risk, Limited Risk, Minimal Risk. Understand the EU AI Act risk tiers and what obligations apply to each.',
    url: 'https://www.getactcomply.com/eu-ai-act-risk-classification',
  },
}

const tiers = [
  {
    level: 'Prohibited',
    color: 'red',
    articles: 'Article 5',
    tagline: 'Banned outright, cannot be deployed in the EU',
    description: 'These AI practices are considered an unacceptable risk to fundamental rights and are prohibited entirely under the EU AI Act.',
    examples: [
      'Social scoring by governments',
      'Real-time biometric surveillance in public spaces (with narrow exceptions)',
      'Emotion recognition in workplaces and educational institutions',
      'Subliminal manipulation techniques that harm people',
      'Predictive policing based solely on profiling',
      'Biometric categorisation inferring political, religious, or sexual orientation',
    ],
    obligations: [],
    fine: '€35M or 7% of global turnover',
  },
  {
    level: 'High Risk',
    color: 'orange',
    articles: 'Articles 9–15, 43–49, Annex III',
    tagline: 'Heavily regulated, 12+ obligations before deployment',
    description: 'AI systems in eight regulated sectors (biometrics, education, employment, credit scoring, law enforcement, migration, justice, critical infrastructure) face the most stringent requirements.',
    examples: [
      'CV screening and hiring tools',
      'Credit scoring and loan decision systems',
      'Student assessment and exam monitoring',
      'Medical diagnostic AI',
      'AI used in border control',
      'Predictive crime risk assessment tools',
    ],
    obligations: [
      'Risk management system (Article 9)',
      'Data governance and quality (Article 10)',
      'Technical documentation (Article 11)',
      'Automatic logging (Article 12)',
      'Human oversight mechanisms (Article 14)',
      'EU database registration (Article 49)',
    ],
    fine: '€30M or 6% of global turnover',
  },
  {
    level: 'Limited Risk',
    color: 'yellow',
    articles: 'Article 50',
    tagline: 'Transparency obligations only',
    description: 'AI systems that interact with users or generate synthetic content must disclose their AI nature. Lighter touch than high-risk, but legally binding.',
    examples: [
      'Customer service chatbots',
      'AI-generated text, images, or videos (deepfakes)',
      'Emotion recognition systems',
      'AI avatars and virtual assistants',
    ],
    obligations: [
      'Inform users they are interacting with AI (Article 50(1))',
      'Label AI-generated media as synthetic (Article 50(4))',
      'Disclose emotion recognition to subjects (Article 50(3))',
    ],
    fine: '€15M or 3% of global turnover',
  },
  {
    level: 'Minimal Risk',
    color: 'green',
    articles: 'No mandatory requirements',
    tagline: 'No mandatory obligations, voluntary codes encouraged',
    description: 'The vast majority of AI systems fall here. Spam filters, recommendation engines, AI in video games, and most B2B productivity tools are minimal risk. No mandatory compliance requirements, but voluntary codes of conduct are encouraged.',
    examples: [
      'AI-powered spam filters',
      'Content recommendation engines',
      'AI features in productivity software',
      'AI in video games',
      'Simple chatbots with no sensitive decisions',
    ],
    obligations: [],
    fine: null,
  },
]

const colorMap: Record<string, { bg: string; border: string; badge: string; text: string }> = {
  red:    { bg: 'bg-red-50 dark:bg-red-500/10',    border: 'border-red-200 dark:border-red-500/20',    badge: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400',    text: 'text-red-700 dark:text-red-400' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-500/10', border: 'border-orange-200 dark:border-orange-500/20', badge: 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400', text: 'text-orange-700 dark:text-orange-400' },
  yellow: { bg: 'bg-yellow-50 dark:bg-yellow-500/10', border: 'border-yellow-200 dark:border-yellow-500/20', badge: 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-600', text: 'text-yellow-700 dark:text-yellow-500' },
  green:  { bg: 'bg-green-50 dark:bg-green-500/10',  border: 'border-green-200 dark:border-green-500/20',  badge: 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400',  text: 'text-green-700 dark:text-green-400' },
}

export default function RiskClassificationPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white">
      <SiteNav width="4xl">
        <Link href="/assess" className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-3 py-2 rounded-lg transition">
          Free Assessment →
        </Link>
        <ThemeToggle />
      </SiteNav>

      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-sm px-3 py-1.5 rounded-full mb-6">
            Regulation (EU) 2024/1689 · Enforcement: August 2, 2026
          </div>
          <h1 className="text-4xl font-bold mb-4">EU AI Act Risk Classification</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            The EU AI Act uses a <strong className="text-gray-900 dark:text-white">four-tier risk pyramid</strong> to determine which obligations apply to your AI system.
            Classification depends on your system&apos;s purpose, sector, and potential impact on people, not its technical architecture.
          </p>
        </div>

        <div className="space-y-6 mb-16">
          {tiers.map(tier => {
            const c = colorMap[tier.color]
            return (
              <div key={tier.level} className={`rounded-2xl border p-6 ${c.bg} ${c.border}`}>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${c.badge}`}>{tier.level.toUpperCase()}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">{tier.articles}</span>
                  </div>
                  {tier.fine && (
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 shrink-0">Fine: {tier.fine}</span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{tier.tagline}</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-5">{tier.description}</p>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Examples</p>
                    <ul className="space-y-1">
                      {tier.examples.map(e => (
                        <li key={e} className="text-sm text-gray-700 dark:text-gray-300 flex gap-2">
                          <span className={`mt-0.5 shrink-0 ${c.text}`}>•</span>{e}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {tier.obligations.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Key Obligations</p>
                      <ul className="space-y-1">
                        {tier.obligations.map(o => (
                          <li key={o} className="text-sm text-gray-700 dark:text-gray-300 flex gap-2">
                            <span className={`mt-0.5 shrink-0 ${c.text}`}>✓</span>{o}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="bg-blue-600 text-white rounded-2xl p-8 text-center mb-8">
          <h2 className="text-2xl font-bold mb-3">Classify your AI system in 5 minutes</h2>
          <p className="text-blue-100 mb-6">
            Answer questions about what your AI does and who it affects. Get an instant tier classification with the exact articles that apply.
          </p>
          <Link href="/assess" className="inline-block bg-white text-blue-600 hover:bg-blue-50 font-semibold px-8 py-3 rounded-xl transition">
            Start free assessment →
          </Link>
        </div>

        <div className="mt-12 mb-8">
          <RelatedGuides currentSlug="eu-ai-act-risk-classification" />
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-5 text-sm text-gray-600 dark:text-gray-400">
          <strong className="text-gray-900 dark:text-white">Disclaimer:</strong> This page is for informational purposes only and does not constitute legal advice. Consult a qualified legal professional for advice specific to your organisation.
        </div>
      </div>

      <footer className="border-t border-gray-200 dark:border-white/10 px-6 py-8 mt-8">
        <div className="max-w-4xl mx-auto flex flex-wrap gap-6 text-sm text-gray-500">
          <Link href="/" className="hover:text-gray-700 dark:hover:text-gray-300 transition">Home</Link>
          <Link href="/eu-ai-act-compliance-checklist" className="hover:text-gray-700 dark:hover:text-gray-300 transition">Compliance Checklist</Link>
          <Link href="/eu-ai-act-high-risk-ai-systems" className="hover:text-gray-700 dark:hover:text-gray-300 transition">High-Risk AI Systems</Link>
          <Link href="/terms" className="hover:text-gray-700 dark:hover:text-gray-300 transition">Terms</Link>
          <Link href="/privacy" className="hover:text-gray-700 dark:hover:text-gray-300 transition">Privacy</Link>
        </div>
      </footer>
    </div>
  )
}
