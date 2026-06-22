import type { Metadata } from 'next'
import Link from 'next/link'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'EU AI Act Resources & Compliance Guides | ActComply',
  description: 'Free guides on EU AI Act compliance: sector playbooks, article-by-article breakdowns, country requirements, and role-specific checklists.',
  alternates: { canonical: 'https://www.getactcomply.com/resources' },
}

interface SeoPage {
  slug: string
  title: string
  meta_description: string | null
}

function categorise(slug: string): string {
  if (slug.startsWith('eu-ai-act-article') || slug.includes('gpai') || slug.includes('annex')) return 'Article reference'
  if (slug.endsWith('-eu-ai-act-compliance') && !slug.startsWith('eu-ai-act')) return 'Sector guides'
  if (slug.startsWith('eu-ai-act-') && ['germany','france','netherlands','spain','italy','sweden','poland','belgium','austria','ireland'].some(c => slug.includes(c))) return 'Country guides'
  if (slug.startsWith('eu-ai-act-guide-')) return 'Role guides'
  if (slug.startsWith('actcomply-vs-')) return 'Comparisons'
  return 'Guides'
}

export default async function ResourcesPage() {
  const supabase = getSupabaseAdmin()
  const { data: pages } = await supabase
    .from('seo_pages')
    .select('slug, title, meta_description')
    .order('slug', { ascending: true })

  const grouped: Record<string, SeoPage[]> = {}
  for (const page of pages ?? []) {
    const cat = categorise(page.slug)
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(page)
  }

  const categoryOrder = ['Sector guides', 'Article reference', 'Country guides', 'Role guides', 'Comparisons', 'Guides']

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <nav className="mb-8 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/" className="hover:text-gray-900 dark:hover:text-gray-100">ActComply</Link>
          {' / '}
          <span>Resources</span>
        </nav>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
          EU AI Act Compliance Guides
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-10">
          Free resources for CTOs, founders, and compliance teams navigating the EU AI Act.
        </p>

        {categoryOrder.filter(cat => grouped[cat]?.length).map(cat => (
          <section key={cat} className="mb-10">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
              {cat}
            </h2>
            <ul className="space-y-3">
              {grouped[cat].map(page => (
                <li key={page.slug}>
                  <Link
                    href={`/resources/${page.slug}`}
                    className="group block p-4 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-700 dark:group-hover:text-blue-400">
                      {page.title}
                    </span>
                    {page.meta_description && (
                      <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                        {page.meta_description}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <div className="mt-12 p-6 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-100 dark:border-blue-900">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Not sure which rules apply to your AI system?
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            The free ActComply risk screener classifies your system in under 5 minutes.
          </p>
          <Link
            href="/check?utm_source=seo&utm_medium=resource&utm_campaign=index-cta"
            className="inline-block text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Run the free screener
          </Link>
        </div>
      </div>
    </div>
  )
}
