import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

interface SeoPage {
  slug: string
  title: string
  meta_description: string | null
  content: string
  schema_markup: Record<string, unknown> | null
  internal_links: string[] | null
  created_at: string
}

export const revalidate = 3600

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const supabase = getSupabaseAdmin()
  const { data } = await supabase
    .from('seo_pages')
    .select('title, meta_description, slug')
    .eq('slug', slug)
    .single()

  if (!data) return { title: 'EU AI Act Guide | ActComply' }

  return {
    title: data.title,
    description: data.meta_description ?? undefined,
    alternates: { canonical: `https://www.getactcomply.com/resources/${data.slug}` },
    openGraph: {
      title: data.title,
      description: data.meta_description ?? undefined,
      url: `https://www.getactcomply.com/resources/${data.slug}`,
    },
  }
}

export default async function ResourcePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = getSupabaseAdmin()
  const { data: page } = await supabase
    .from('seo_pages')
    .select('*')
    .eq('slug', slug)
    .single<SeoPage>()

  if (!page) notFound()

  const publishedDate = new Date(page.created_at).toISOString()

  return (
    <>
      {page.schema_markup && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Article',
              headline: page.title,
              datePublished: publishedDate,
              author: { '@type': 'Person', name: 'Zac Lowe' },
              publisher: {
                '@type': 'Organization',
                name: 'ActComply',
                url: 'https://www.getactcomply.com',
              },
              ...page.schema_markup,
            }),
          }}
        />
      )}
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <nav className="mb-8 text-sm text-gray-500 dark:text-gray-400">
            <Link href="/" className="hover:text-gray-900 dark:hover:text-gray-100">ActComply</Link>
            {' / '}
            <Link href="/resources" className="hover:text-gray-900 dark:hover:text-gray-100">Resources</Link>
            {' / '}
            <span>{page.title}</span>
          </nav>

          <article className="prose dark:prose-invert prose-gray max-w-none">
            <h1>{page.title}</h1>
            <div dangerouslySetInnerHTML={{ __html: page.content }} />
          </article>

          {page.internal_links && page.internal_links.length > 0 && (
            <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Related guides</h3>
              <ul className="space-y-2">
                {page.internal_links.map((link) => (
                  <li key={link}>
                    <Link href={link} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                      {link.replace('/resources/', '').replace(/-/g, ' ')}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-12 p-6 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-100 dark:border-blue-900">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
              Check your EU AI Act risk in 5 minutes
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Free risk classifier. No signup required. August 2 deadline.
            </p>
            <Link
              href="/check?utm_source=seo&utm_medium=resource&utm_campaign=page-cta"
              className="inline-block text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Run the free screener
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
