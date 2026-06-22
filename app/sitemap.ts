import type { MetadataRoute } from 'next'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

const BASE = 'https://www.getactcomply.com'

const STATIC_PAGES: MetadataRoute.Sitemap = [
  { url: BASE, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
  { url: `${BASE}/check`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.95 },
  { url: `${BASE}/assess`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
  { url: `${BASE}/resources`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.85 },
  { url: `${BASE}/eu-ai-act-compliance-checklist`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
  { url: `${BASE}/eu-ai-act-high-risk-ai-systems`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
  { url: `${BASE}/eu-ai-act-risk-classification`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
  { url: `${BASE}/eu-ai-act-omnibus-update`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
  { url: `${BASE}/eu-ai-act-fria-scope`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
  { url: `${BASE}/eu-ai-act-fria-template`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  { url: `${BASE}/eu-ai-act-deployer-obligations`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
  { url: `${BASE}/eu-ai-act-transparency-obligations`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
  { url: `${BASE}/eu-ai-act-substantial-modification`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  { url: `${BASE}/eu-ai-act-gpai-provider-obligations`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let resourcePages: MetadataRoute.Sitemap = []

  try {
    const supabase = getSupabaseAdmin()
    const { data } = await supabase
      .from('seo_pages')
      .select('slug, updated_at')
      .order('slug', { ascending: true })

    resourcePages = (data ?? []).map(page => ({
      url: `${BASE}/resources/${page.slug}`,
      lastModified: page.updated_at ? new Date(page.updated_at) : new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.75,
    }))
  } catch {
    // Fallback to no resource pages if DB is unavailable at build time
  }

  return [...STATIC_PAGES, ...resourcePages]
}
