import Link from 'next/link'
import type { Metadata } from 'next'
import { ThemeToggle } from '@/components/ThemeToggle'
import { RelatedGuides } from '@/components/RelatedGuides'
import { SiteNav } from '@/components/SiteNav'

export const metadata: Metadata = {
  title: 'EU AI Act Omnibus Update: What Changed and What Didn\'t',
  description: 'A provisional agreement reached in May 2026 extends high-risk AI Act deadlines. Annex III obligations move to December 2027. August 2, 2026 enforcement powers unchanged. Here\'s what your organisation needs to do now.',
  alternates: { canonical: 'https://www.getactcomply.com/eu-ai-act-omnibus-update' },
  openGraph: {
    title: 'EU AI Act Omnibus: What Changed and What Didn\'t',
    description: 'High-risk AI deadlines extended to December 2027, but August 2, 2026 enforcement powers are unchanged. What this means for your compliance programme.',
    url: 'https://www.getactcomply.com/eu-ai-act-omnibus-update',
  },
}

const timeline = [
  {
    date: 'February 2, 2025',
    status: 'in force',
    label: 'Prohibited AI: already enforced',
    description: 'Article 5 prohibitions are live. Social scoring, real-time biometric surveillance in public spaces, manipulation of vulnerable groups: all banned. No change under Omnibus.',
    refs: 'Article 5',
    color: 'red',
  },
  {
    date: 'August 2, 2025',
    status: 'in force',
    label: 'GPAI obligations: already enforced',
    description: 'General Purpose AI model providers must comply with Articles 53–55: technical documentation, copyright summaries, transparency, and adversarial testing for systemic risk models. No change under Omnibus.',
    refs: 'Articles 53–55',
    color: 'red',
  },
  {
    date: 'August 2, 2026',
    status: 'upcoming',
    label: 'Enforcement powers go live: inventory deadline',
    description: 'Supervisory authorities gain full enforcement powers from this date. All organisations must have completed their AI inventory and risk classification. Prohibited AI and GPAI compliance will be actively reviewed. This date is unchanged by the Omnibus.',
    refs: 'Annex III, Articles 5, 53–55',
    color: 'amber',
    highlight: true,
  },
  {
    date: 'December 2, 2027',
    status: 'extended',
    label: 'High-risk AI (Annex III): full obligations',
    description: 'Standalone high-risk AI systems (hiring, credit scoring, education, law enforcement, biometrics, migration) must meet full Article 9–27 obligations: risk management, technical documentation, human oversight, conformity assessment, EU database registration. Extended from August 2, 2026 under Omnibus provisional agreement.',
    refs: 'Annex III, Articles 9–27, 43, 49',
    color: 'blue',
  },
  {
    date: 'August 2, 2028',
    status: 'extended',
    label: 'High-risk AI embedded in products (Annex I)',
    description: 'AI systems integrated into regulated products (medical devices, machinery, toys, aviation, automotive) face full obligations from this date. Extended under Omnibus provisional agreement.',
    refs: 'Annex I, Articles 9–27',
    color: 'blue',
  },
]

const whatStillMatters = [
  {
    title: 'Complete your AI inventory',
    description: 'You cannot navigate a split enforcement landscape without knowing exactly what AI systems you operate, where they sit in the risk classification, and which deadline applies to each. Supervisory authorities can ask for this from August 2, 2026.',
  },
  {
    title: 'Classify every system by risk tier',
    description: 'Prohibited, high-risk (Annex III or Annex I), limited-risk, or minimal-risk. The classification determines which deadline and which obligations apply. Misclassification is itself a compliance failure.',
  },
  {
    title: 'Don\'t pause high-risk compliance work',
    description: 'The extension to December 2027 is 18 months. That sounds like a lot. High-risk AI conformity assessments, technical documentation, and risk management systems take 3–9 months to build properly. Organisations that use the extension to restart the "do we need to do this" conversation will find themselves back here in 2027 in a worse position.',
  },
  {
    title: 'Document your assumptions',
    description: 'The Omnibus is a provisional agreement. It requires formal adoption by Parliament and Council. Until that happens, treat August 2, 2026 as operative for all obligations. Any compliance programme built on the Omnibus timeline should document that assumption explicitly so it\'s auditable if the architecture changes.',
  },
]

const statusColor = {
  'in force': 'bg-red-500/10 text-red-500 border-red-500/20',
  upcoming: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  extended: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
}

const dotColor = {
  red: 'bg-red-500',
  amber: 'bg-amber-500',
  blue: 'bg-blue-500',
}

export default function OmnibusUpdatePage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-white">
      <SiteNav width="4xl">
        <Link href="/assess" className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-lg transition font-medium">
          Assess your AI systems →
        </Link>
        <ThemeToggle />
      </SiteNav>

      <main className="max-w-4xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="mb-12">
          <div className="flex flex-wrap gap-2 mb-6">
            <span className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs px-3 py-1.5 rounded-full font-medium">
              Provisional agreement: formal adoption pending
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 text-xs px-3 py-1.5 rounded-full">
              Updated May 8, 2026
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            EU AI Act Omnibus:<br />
            <span className="text-blue-500 dark:text-blue-400">What changed and what didn't</span>
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
            A provisional political agreement reached in May 2026 extends key high-risk AI deadlines.
            August 2, 2026 enforcement powers are <strong className="text-gray-900 dark:text-white">unchanged</strong>.
            Here's what your compliance programme needs to know.
          </p>
        </div>

        {/* Key callout */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 mb-12">
          <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-2">The one thing to understand</p>
          <p className="text-gray-900 dark:text-white font-medium text-lg leading-relaxed">
            Supervisory authorities have full enforcement powers from August 2, 2026 regardless of the Omnibus timeline.
            The extension gives you more time to meet high-risk obligations. It does not give you more time to know what you have.
          </p>
        </div>

        {/* Timeline */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-8">Updated enforcement timeline</h2>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200 dark:bg-white/10" />
            <div className="space-y-8">
              {timeline.map((item) => (
                <div key={item.date} className={`relative pl-12 ${item.highlight ? 'bg-amber-500/5 border border-amber-500/20 rounded-xl p-5 -ml-5 pl-14' : ''}`}>
                  <div className={`absolute left-2 top-1 w-5 h-5 rounded-full border-2 border-gray-50 dark:border-gray-950 ${dotColor[item.color as keyof typeof dotColor]}`} />
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <span className="text-sm font-mono text-gray-500 dark:text-gray-400">{item.date}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusColor[item.status as keyof typeof statusColor]}`}>
                      {item.status === 'in force' ? 'In force' : item.status === 'upcoming' ? 'Unchanged' : 'Extended, Omnibus'}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{item.label}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-2">{item.description}</p>
                  <span className="text-xs font-mono text-blue-600 dark:text-blue-400">{item.refs}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What still matters */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-2">What your organisation should still be doing</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">The extension changes the deadline, not the work.</p>
          <div className="space-y-4">
            {whatStillMatters.map((item, i) => (
              <div key={i} className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-7 h-7 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{item.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Important caveat */}
        <section className="mb-16 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-bold mb-3">Important: The Omnibus is not yet law</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
            The May 2026 agreement is a provisional political agreement. It requires formal adoption by both the European Parliament and the Council of the EU before taking legal effect. Until that happens, the original EU AI Act dates remain operative. Any compliance programme built around the Omnibus extended timelines should treat that as an assumption, not a certainty, and document it as such.
          </p>
        </section>

        {/* CTA */}
        <section className="bg-blue-600 rounded-2xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-3">Know where your AI systems stand</h2>
          <p className="text-blue-100 mb-6 max-w-xl mx-auto">
            Assess any AI system against the EU AI Act in under 5 minutes. Free risk classification, compliance roadmap, and article-referenced requirements, updated for the Omnibus timeline.
          </p>
          <Link
            href="/assess"
            className="inline-block bg-white text-blue-600 hover:bg-blue-50 font-semibold px-8 py-3 rounded-xl transition"
          >
            Assess your AI systems free →
          </Link>
          <p className="text-blue-200 text-xs mt-3">No credit card required</p>
        </section>

        <RelatedGuides currentSlug="eu-ai-act-omnibus-update" />

      </main>

      <footer className="border-t border-gray-200 dark:border-white/10 py-8 mt-16">
        <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <span>© 2026 ActComply. Not legal advice.</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-gray-600 dark:hover:text-gray-300 transition">Privacy</Link>
            <Link href="/terms" className="hover:text-gray-600 dark:hover:text-gray-300 transition">Terms</Link>
            <Link href="/eu-ai-act-compliance-checklist" className="hover:text-gray-600 dark:hover:text-gray-300 transition">Full checklist</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
