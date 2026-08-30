import Link from 'next/link'
import type { Metadata } from 'next'
import { ThemeToggle } from '@/components/ThemeToggle'
import { HIGH_RISK_REQUIREMENTS, LIMITED_RISK_REQUIREMENTS, GENERAL_PROVIDER_REQUIREMENTS, GPAI_REQUIREMENTS } from '@/lib/eu-ai-act'
import { RelatedGuides } from '@/components/RelatedGuides'
import { SiteNav } from '@/components/SiteNav'

export const metadata: Metadata = {
  title: 'EU AI Act Compliance Checklist 2026',
  description: 'Complete EU AI Act compliance checklist covering all 27 obligations, high-risk AI systems, GPAI models, transparency requirements, and general provider duties. Free assessment tool included.',
  alternates: { canonical: 'https://www.getactcomply.com/eu-ai-act-compliance-checklist' },
  openGraph: {
    title: 'EU AI Act Compliance Checklist 2026: All 27 Obligations',
    description: 'Complete checklist of EU AI Act compliance requirements. Free assessment tool to check your AI systems.',
    url: 'https://www.getactcomply.com/eu-ai-act-compliance-checklist',
  },
}

const effortColor = (e: string) =>
  e === 'HIGH' ? 'text-red-600 dark:text-red-400' : e === 'MEDIUM' ? 'text-yellow-600 dark:text-yellow-500' : 'text-green-600 dark:text-green-400'

function RequirementSection({ title, items, description }: { title: string; items: typeof HIGH_RISK_REQUIREMENTS; description: string }) {
  return (
    <section className="mb-12">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{title}</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">{description}</p>
      <div className="space-y-3">
        {items.map(req => (
          <div key={req.id} className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-5">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <span className="text-xs font-mono text-blue-600 dark:text-blue-400 mr-2">{req.article}</span>
                <span className="font-semibold text-gray-900 dark:text-white">{req.title}</span>
              </div>
              <span className={`text-xs font-semibold shrink-0 ${effortColor(req.effort)}`}>{req.effort} effort</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{req.description}</p>
            <span className="text-xs text-gray-500 dark:text-gray-500">Deadline: {req.deadline}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

export default function ChecklistPage() {
  const total = HIGH_RISK_REQUIREMENTS.length + LIMITED_RISK_REQUIREMENTS.length + GENERAL_PROVIDER_REQUIREMENTS.length + GPAI_REQUIREMENTS.length

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
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-sm px-3 py-1.5 rounded-full mb-4">
            Updated May 2026 · Regulation (EU) 2024/1689 + Omnibus agreement
          </div>
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs px-3 py-1.5 rounded-full mb-6 ml-2">
            Omnibus: High-risk deadlines extended, Aug 2, 2026 enforcement powers still live
          </div>
          <h1 className="text-4xl font-bold mb-4">EU AI Act Compliance Checklist</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
            All <strong className="text-gray-900 dark:text-white">{total} compliance obligations</strong> under the EU AI Act (Regulation EU 2024/1689),
            mapped by article, effort, and deadline. Enforcement powers go live <strong className="text-gray-900 dark:text-white">August 2, 2026</strong>. High-risk AI (Annex III) obligations extended to <strong className="text-gray-900 dark:text-white">December 2, 2027</strong> under the Omnibus provisional agreement.
          </p>
          <div className="bg-blue-600 text-white rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-lg">Check your specific AI systems</p>
              <p className="text-blue-100 text-sm">Get a personalised compliance roadmap, takes 5 minutes, free.</p>
            </div>
            <Link href="/assess" className="shrink-0 bg-white text-blue-600 hover:bg-blue-50 font-semibold px-6 py-3 rounded-xl transition">
              Start free assessment →
            </Link>
          </div>
        </div>

        <RequirementSection
          title="High-Risk AI Systems (Annex III)"
          description="Organisations deploying AI systems in regulated sectors must meet all 12 of these obligations before placing their system on the market."
          items={HIGH_RISK_REQUIREMENTS}
        />
        <RequirementSection
          title="General Provider Obligations (Articles 16–27)"
          description="All providers and deployers of AI systems, not just high-risk, must comply with these baseline obligations."
          items={GENERAL_PROVIDER_REQUIREMENTS}
        />
        <RequirementSection
          title="GPAI Model Obligations (Articles 53–55)"
          description="Organisations that provide general-purpose AI models (including fine-tuned versions) have additional documentation and transparency duties."
          items={GPAI_REQUIREMENTS}
        />
        <RequirementSection
          title="Limited Risk, Transparency Obligations (Article 50)"
          description="AI systems that interact with users (chatbots, emotion recognition, synthetic media) must meet these minimum transparency requirements."
          items={LIMITED_RISK_REQUIREMENTS}
        />

        <div className="mt-12 mb-12">
          <RelatedGuides currentSlug="eu-ai-act-compliance-checklist" />
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6 text-sm text-gray-600 dark:text-gray-400">
          <strong className="text-gray-900 dark:text-white">Disclaimer:</strong> This checklist is for informational purposes and does not constitute legal advice. Consult a qualified legal professional for advice specific to your organisation and AI systems.
        </div>
      </div>

      <footer className="border-t border-gray-200 dark:border-white/10 px-6 py-8 mt-8">
        <div className="max-w-4xl mx-auto flex gap-6 text-sm text-gray-500">
          <Link href="/" className="hover:text-gray-700 dark:hover:text-gray-300 transition">Home</Link>
          <Link href="/terms" className="hover:text-gray-700 dark:hover:text-gray-300 transition">Terms</Link>
          <Link href="/privacy" className="hover:text-gray-700 dark:hover:text-gray-300 transition">Privacy</Link>
        </div>
      </footer>
    </div>
  )
}
