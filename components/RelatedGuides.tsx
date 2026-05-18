import Link from 'next/link'

type Guide = {
  slug: string
  title: string
  description: string
}

const GUIDES: Guide[] = [
  {
    slug: 'eu-ai-act-compliance-checklist',
    title: 'EU AI Act Compliance Checklist',
    description: 'All 27 obligations across high risk, limited risk, general provider, and GPAI categories.',
  },
  {
    slug: 'eu-ai-act-risk-classification',
    title: 'EU AI Act Risk Classification',
    description: 'Walk through the four risk tiers and how to classify your AI system.',
  },
  {
    slug: 'eu-ai-act-high-risk-ai-systems',
    title: 'High Risk AI Systems',
    description: 'Annex III categories and what counts as high risk under the AI Act.',
  },
  {
    slug: 'eu-ai-act-omnibus-update',
    title: 'Omnibus Update',
    description: 'How the May 2026 provisional agreement shifts high risk deadlines, and what stays unchanged.',
  },
  {
    slug: 'eu-ai-act-deployer-obligations',
    title: 'Article 26 Deployer Obligations',
    description: 'All twelve Article 26 obligations attaching to every deployer of a high risk system on August 2.',
  },
  {
    slug: 'eu-ai-act-fria-scope',
    title: 'Article 27 FRIA Scope',
    description: 'Who the Fundamental Rights Impact Assessment actually applies to, and what fills the gap when it doesn\'t.',
  },
  {
    slug: 'eu-ai-act-fria-template',
    title: 'Article 27 FRIA Template',
    description: 'Working one page template covering the six Article 27(1) inputs, with PDF download.',
  },
  {
    slug: 'eu-ai-act-transparency-obligations',
    title: 'Article 50 Transparency Obligations',
    description: 'Provider and deployer obligations across chatbots, generative content, emotion recognition, and deep fakes.',
  },
  {
    slug: 'eu-ai-act-substantial-modification',
    title: 'Article 25(1)(b) Substantial Modification',
    description: 'When a deployer becomes a provider through substantial modification, and what crossing the line costs.',
  },
  {
    slug: 'eu-ai-act-gpai-provider-obligations',
    title: 'GPAI Provider Obligations',
    description: 'Article 53 + 55 obligations for general purpose AI model providers, plus the 10 July 2025 Code of Practice.',
  },
]

export function RelatedGuides({ currentSlug }: { currentSlug?: string }) {
  const others = GUIDES.filter((g) => g.slug !== currentSlug)
  return (
    <section className="mb-12">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Related guides</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6">More EU AI Act compliance pieces from ActComply.</p>
      <div className="grid sm:grid-cols-2 gap-3">
        {others.map((guide) => (
          <Link
            key={guide.slug}
            href={`/${guide.slug}`}
            className="group bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-blue-500/50 dark:hover:border-blue-400/50 rounded-xl p-5 transition"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 mb-1.5 text-sm transition">
              {guide.title}
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{guide.description}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
