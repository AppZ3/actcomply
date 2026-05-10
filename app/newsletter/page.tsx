import type { Metadata } from 'next'
import Link from 'next/link'
import { NewsletterSignup } from '@/components/NewsletterSignup'

export const metadata: Metadata = {
  title: "Builder's Notes on the EU AI Act — ActComply Newsletter",
  description:
    'Plain-English notes on the EU AI Act, written by a builder shipping a compliance product. One email when there is something worth saying.',
  alternates: { canonical: 'https://www.getactcomply.com/newsletter' },
}

export default function NewsletterPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/" className="font-semibold tracking-tight">
            ActComply
          </Link>
          <Link
            href="/"
            className="text-sm text-slate-400 hover:text-white transition"
          >
            ← Back to ActComply
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-16 sm:py-24">
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400 mb-3">
            Newsletter
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
            Builder's Notes on the EU AI Act.
          </h1>
        </div>

        <div className="space-y-5 text-[17px] leading-relaxed text-slate-300 mb-10">
          <p>
            I'm Zac. I'm not a lawyer. I'm a software builder who's spent the last
            year figuring out the EU AI Act because my product depends on it.
          </p>
          <p>
            This newsletter is the public-facing version of what I'm learning while
            building <Link href="/" className="text-blue-400 hover:text-blue-300 underline underline-offset-4">ActComply</Link>{' '}
            — a compliance tool for AI startups. I write about Act articles in plain
            English, share what's actually surfacing in customer conversations, and
            occasionally publish the messy interim of building in a regulated space.
          </p>
          <p>
            One email when there's something worth saying — usually weekly. No
            recycled blog posts. No "thought leadership." If it doesn't change how
            you ship, it doesn't go in.
          </p>
        </div>

        <NewsletterSignup
          source="newsletter-page"
          variant="card"
          heading="Subscribe"
          subheading="Free. Unsubscribe in one click. Replies come straight to my inbox."
        />

        <div className="mt-16 pt-10 border-t border-white/10 text-sm text-slate-500 leading-relaxed">
          <p className="mb-3">
            <strong className="text-slate-300">Who it's for:</strong> founders and
            product teams shipping AI features in or to the EU, who want a working
            understanding of the Act without paying €400/hour for legal advice.
          </p>
          <p>
            <strong className="text-slate-300">What I won't send:</strong> sales
            pitches, sponsored sections, or anything I wouldn't want to receive
            myself. If ActComply ever pays your email, it's because I think it solves
            a problem the issue is talking about.
          </p>
        </div>
      </main>
    </div>
  )
}
