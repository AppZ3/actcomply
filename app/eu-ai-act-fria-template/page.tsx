import Link from 'next/link'
import type { Metadata } from 'next'
import { ThemeToggle } from '@/components/ThemeToggle'
import { DownloadPdfButton } from './DownloadPdfButton'
import './print.css'

export const metadata: Metadata = {
  title: 'Article 27 FRIA Template (EU AI Act) — Free Working Version',
  description: 'Free one-page working template for the Article 27 Fundamental Rights Impact Assessment under the EU AI Act. Covers the six required inputs verbatim. Use until the official AI Office questionnaire is published.',
  alternates: { canonical: 'https://www.getactcomply.com/eu-ai-act-fria-template' },
  openGraph: {
    title: 'Article 27 FRIA Template — Free Working Version',
    description: 'One-page Article 27 FRIA template for EU AI Act deployers. Free to use and adapt.',
    url: 'https://www.getactcomply.com/eu-ai-act-fria-template',
  },
}

const sectionA = [
  'Organisation name',
  'Date of assessment',
  'AI system name and version',
  'Provider (if different from deployer)',
  'Member State(s) of deployment',
  'Annex III category',
  'Article 27 basis (public body / private entity providing public services / deployer of Annex III 5(b) or 5(c) system)',
]

const friaInputs = [
  {
    n: 1,
    title: 'Description of deployer processes',
    quote: 'A description of the deployer’s processes in which the high-risk AI system will be used in line with its intended purpose.',
  },
  {
    n: 2,
    title: 'Period and frequency of use',
    quote: 'A description of the period of time within which, and the frequency with which, each high-risk AI system is intended to be used.',
  },
  {
    n: 3,
    title: 'Categories of affected persons and groups',
    quote: 'The categories of natural persons and groups likely to be affected by its use in the specific context.',
  },
  {
    n: 4,
    title: 'Specific risks of harm',
    quote: 'The specific risks of harm likely to have an impact on the categories of natural persons or groups.',
  },
  {
    n: 5,
    title: 'Human oversight measures',
    quote: 'A description of the implementation of human oversight measures, according to the instructions for use.',
  },
  {
    n: 6,
    title: 'Risk materialisation response',
    quote: 'The measures to be taken in the case of the materialisation of those risks, including the arrangements for internal governance and complaint mechanisms.',
  },
]

const sectionC = [
  'Author',
  'Reviewer',
  'Sign-off date',
  'Article 27(2) notification to market surveillance authority (sent / pending / not applicable)',
  'Related GDPR Article 35 DPIA reference (per Article 27(3): the FRIA "shall complement" the DPIA where obligations overlap)',
  'Next review date',
]

export default function FriaTemplatePage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-white">
      <nav className="border-b border-gray-200 dark:border-white/10 bg-white dark:bg-gray-950 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-sm text-white">AI</div>
            <span className="font-semibold text-lg">ActComply</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/eu-ai-act-fria-scope" className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition">
              About Article 27 scope
            </Link>
            <Link href="/assess" className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-lg transition font-medium">
              Assess free &rarr;
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-12 print:py-6">

        {/* Header */}
        <div className="mb-10 print:mb-6">
          <div className="flex flex-wrap gap-2 mb-4 print:hidden">
            <span className="inline-flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs px-3 py-1.5 rounded-full font-medium">
              Working draft
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 text-xs px-3 py-1.5 rounded-full">
              Pending AI Office template under Article 27(5)
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold mb-3 leading-tight">
            Article 27 FRIA Template
          </h1>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm mb-5">
            Fundamental Rights Impact Assessment under Regulation (EU) 2024/1689, Article 27.
            Working template pending publication of the official AI Office questionnaire under Article 27(5).
            The six inputs below reproduce the wording of Article 27(1) verbatim. Free to use and adapt.
          </p>
          <DownloadPdfButton />
        </div>

        {/* Section A */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Section A &mdash; Organisation and system details</h2>
          <div className="border border-gray-200 dark:border-white/10 rounded-xl divide-y divide-gray-200 dark:divide-white/10 overflow-hidden">
            {sectionA.map((label) => (
              <div key={label} className="grid grid-cols-1 md:grid-cols-2 gap-2 p-4 bg-white dark:bg-white/5">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</div>
                <div className="text-sm text-gray-400 dark:text-gray-500 italic">[entry]</div>
              </div>
            ))}
          </div>
        </section>

        {/* Section B */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Section B &mdash; The six Article 27(1) inputs</h2>
          <div className="space-y-4">
            {friaInputs.map((input) => (
              <div key={input.n} className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-5">
                <div className="flex items-start gap-4">
                  <div className="w-7 h-7 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
                    {input.n}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1.5">{input.title}</h3>
                    <p className="text-sm italic text-gray-600 dark:text-gray-400 leading-relaxed mb-3">&ldquo;{input.quote}&rdquo;</p>
                    <div className="bg-gray-50 dark:bg-white/5 border border-dashed border-gray-300 dark:border-white/10 rounded-lg p-4 text-sm text-gray-400 dark:text-gray-500 italic min-h-[80px]">
                      [free text]
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section C */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Section C &mdash; Sign-off and filing status</h2>
          <div className="border border-gray-200 dark:border-white/10 rounded-xl divide-y divide-gray-200 dark:divide-white/10 overflow-hidden">
            {sectionC.map((label) => (
              <div key={label} className="grid grid-cols-1 md:grid-cols-2 gap-2 p-4 bg-white dark:bg-white/5">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</div>
                <div className="text-sm text-gray-400 dark:text-gray-500 italic">[entry]</div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA print:hidden */}
        <section className="bg-blue-600 rounded-2xl p-8 text-white text-center mb-8 print:hidden">
          <h2 className="text-xl font-bold mb-3">Need a written read on your specific AI surface?</h2>
          <p className="text-blue-100 mb-6 max-w-xl mx-auto text-sm">
            ActComply runs the Article 27 scope check end to end. Send us one surface and we return a written analysis on
            whether FRIA attaches, what Article 26 deployer obligations apply, and how the DPIA overlap works.
          </p>
          <Link
            href="/assess"
            className="inline-block bg-white text-blue-600 hover:bg-blue-50 font-semibold px-6 py-2.5 rounded-xl transition"
          >
            Assess your AI systems free &rarr;
          </Link>
        </section>

        {/* Download repeater near bottom */}
        <div className="flex items-center justify-between gap-3 print:hidden border-t border-gray-200 dark:border-white/10 pt-6">
          <p className="text-xs text-gray-400">
            One page when printed. Free to use and adapt.
          </p>
          <DownloadPdfButton />
        </div>

      </main>

      <footer className="border-t border-gray-200 dark:border-white/10 py-8 mt-12 print:hidden">
        <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <span>&copy; 2026 ActComply. Not legal advice.</span>
          <div className="flex gap-4">
            <Link href="/eu-ai-act-fria-scope" className="hover:text-gray-600 dark:hover:text-gray-300 transition">FRIA scope guide</Link>
            <Link href="/privacy" className="hover:text-gray-600 dark:hover:text-gray-300 transition">Privacy</Link>
            <Link href="/terms" className="hover:text-gray-600 dark:hover:text-gray-300 transition">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
