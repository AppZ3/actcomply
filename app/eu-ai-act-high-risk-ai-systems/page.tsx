import Link from 'next/link'
import type { Metadata } from 'next'
import { ThemeToggle } from '@/components/ThemeToggle'
import { HIGH_RISK_CATEGORIES } from '@/lib/eu-ai-act'

export const metadata: Metadata = {
  title: 'EU AI Act High-Risk AI Systems: Full List 2026',
  description: 'Complete list of high-risk AI systems under the EU AI Act Annex III. Find out if your AI system is classified as high-risk and what obligations apply.',
  alternates: { canonical: 'https://www.getactcomply.com/eu-ai-act-high-risk-ai-systems' },
  openGraph: {
    title: 'EU AI Act High-Risk AI Systems: Full List 2026',
    description: 'Is your AI system high-risk under the EU AI Act? Full Annex III category list with compliance requirements.',
    url: 'https://www.getactcomply.com/eu-ai-act-high-risk-ai-systems',
  },
}

const categoryDescriptions: Record<string, string> = {
  'Biometric identification': 'AI systems used for remote biometric identification of natural persons in public spaces, or biometric categorisation systems inferring sensitive attributes.',
  'Critical infrastructure': 'AI used as safety components in critical infrastructure such as road traffic, water, gas, heating, and electricity supply.',
  'Education and training': 'AI that determines access to or assigns persons to educational institutions, or evaluates learning outcomes, including exam monitoring.',
  'Employment and HR': 'AI used for recruitment, screening, evaluating candidates, making promotion or termination decisions, or monitoring employee performance.',
  'Essential private services': 'AI used to evaluate creditworthiness, make credit decisions, set insurance premiums, or assess eligibility for essential public or private services.',
  'Law enforcement': 'AI used by police or judicial authorities for individual risk assessments, polygraphs, crime analytics, or evidence reliability assessment.',
  'Migration and asylum': 'AI used to assess risks related to persons crossing borders, process visa or asylum applications, or detect undocumented migrants.',
  'Administration of justice': 'AI used to assist judicial authorities in interpreting facts and the law, researching and interpreting legal acts, or applying the law to a specific set of facts.',
}

export default function HighRiskPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white">
      <nav className="border-b border-gray-200 dark:border-white/10 bg-white dark:bg-gray-950 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-sm text-white">AI</div>
            <span className="font-semibold text-lg">ActComply</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/assess" className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-3 py-2 rounded-lg transition">
              Free Assessment →
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm px-3 py-1.5 rounded-full mb-6">
            EU AI Act · Annex III · Regulation (EU) 2024/1689
          </div>
          <h1 className="text-4xl font-bold mb-4">EU AI Act High-Risk AI Systems</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            The EU AI Act classifies AI systems into four risk tiers. <strong className="text-gray-900 dark:text-white">High-risk systems</strong> face
            the most stringent obligations, including mandatory risk management, technical documentation, human oversight, and EU database registration -
            all required before deployment.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 mb-10">
            {[
              { label: 'Annex III categories', value: '8' },
              { label: 'Compliance obligations', value: '12+' },
              { label: 'Maximum fine', value: '€30M or 6%' },
            ].map(s => (
              <div key={s.label} className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-blue-500 dark:text-blue-400 mb-1">{s.value}</div>
                <div className="text-sm text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-2">Annex III, High-Risk Categories</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            An AI system is high-risk if it falls within one of the eight Annex III sectors <em>and</em> poses a significant risk to the health, safety, or fundamental rights of persons.
          </p>
          <div className="space-y-4">
            {HIGH_RISK_CATEGORIES.map((cat, i) => (
              <div key={cat.category} className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 shrink-0 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center text-sm font-bold">
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">{cat.category}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                      {categoryDescriptions[cat.category]}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {cat.keywords.slice(0, 5).map(kw => (
                        <span key={kw} className="text-xs bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">{kw}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">What if my AI system is high-risk?</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { title: 'Risk Management System', article: 'Article 9', text: 'Document and maintain a risk management process throughout the full AI lifecycle.' },
              { title: 'Technical Documentation', article: 'Article 11', text: 'Prepare comprehensive technical docs before placing on market, covers architecture, data, and testing.' },
              { title: 'Human Oversight', article: 'Article 14', text: 'Humans must be able to monitor, interpret, and override the system at all times.' },
              { title: 'EU Database Registration', article: 'Article 49', text: 'Register the system in the EU AI database before deployment.' },
            ].map(item => (
              <div key={item.title} className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-5">
                <div className="text-xs font-mono text-blue-600 dark:text-blue-400 mb-1">{item.article}</div>
                <div className="font-semibold mb-2">{item.title}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{item.text}</div>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-4">
            High-risk systems have 12+ total obligations.{' '}
            <Link href="/eu-ai-act-compliance-checklist" className="text-blue-600 dark:text-blue-400 hover:underline">
              See the full checklist →
            </Link>
          </p>
        </section>

        <div className="bg-blue-600 text-white rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-3">Not sure if your AI system is high-risk?</h2>
          <p className="text-blue-100 mb-6">Answer a few questions and get an instant classification with article references. Free, no account required.</p>
          <Link href="/assess" className="inline-block bg-white text-blue-600 hover:bg-blue-50 font-semibold px-8 py-3 rounded-xl transition">
            Assess your AI systems free →
          </Link>
        </div>

        <div className="mt-8 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-5 text-sm text-gray-600 dark:text-gray-400">
          <strong className="text-gray-900 dark:text-white">Disclaimer:</strong> This page is for informational purposes only and does not constitute legal advice. Consult a qualified legal professional for advice specific to your situation.
        </div>
      </div>

      <footer className="border-t border-gray-200 dark:border-white/10 px-6 py-8 mt-8">
        <div className="max-w-4xl mx-auto flex gap-6 text-sm text-gray-500">
          <Link href="/" className="hover:text-gray-700 dark:hover:text-gray-300 transition">Home</Link>
          <Link href="/eu-ai-act-compliance-checklist" className="hover:text-gray-700 dark:hover:text-gray-300 transition">Compliance Checklist</Link>
          <Link href="/eu-ai-act-risk-classification" className="hover:text-gray-700 dark:hover:text-gray-300 transition">Risk Classification</Link>
          <Link href="/terms" className="hover:text-gray-700 dark:hover:text-gray-300 transition">Terms</Link>
          <Link href="/privacy" className="hover:text-gray-700 dark:hover:text-gray-300 transition">Privacy</Link>
        </div>
      </footer>
    </div>
  )
}
