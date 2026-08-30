import Link from 'next/link'
import type { Metadata } from 'next'
import { ThemeToggle } from '@/components/ThemeToggle'
import { NewsletterSignup } from '@/components/NewsletterSignup'
import { RelatedGuides } from '@/components/RelatedGuides'
import { SiteNav } from '@/components/SiteNav'

export const metadata: Metadata = {
  title: 'Article 25(1)(b) Substantial Modification, When a Deployer Becomes a Provider',
  description: 'Article 25(1) of the EU AI Act has three triggers that turn a deployer, distributor, importer, or third party into a provider with full Article 16 obligations. Substantial modification is the most contested. Practical guide to where the line sits.',
  alternates: { canonical: 'https://www.getactcomply.com/eu-ai-act-substantial-modification' },
  openGraph: {
    title: 'Article 25(1)(b) Substantial Modification Explained',
    description: 'When does fine-tuning, re-training, or adapting an AI system turn you into the provider? The Article 25 triggers, the Article 3(23) definition, and the practical line.',
    url: 'https://www.getactcomply.com/eu-ai-act-substantial-modification',
  },
}

const triggers = [
  {
    para: 'Article 25(1)(a)',
    title: 'Rebranding',
    body: 'You put your name or trademark on a high risk AI system that has already been placed on the market or put into service. Reselling under your own brand makes you the provider for compliance purposes, even if you did not develop or modify the system.',
  },
  {
    para: 'Article 25(1)(b)',
    title: 'Substantial modification',
    body: 'You make a substantial modification to a high risk AI system that has already been placed on the market or put into service, in such a way that it remains a high risk AI system. The key term is "substantial modification" (Article 3(23)): a change that is not foreseen or planned in the initial conformity assessment.',
  },
  {
    para: 'Article 25(1)(c)',
    title: 'Modifying intended purpose',
    body: 'You modify the intended purpose of an AI system, including a general purpose AI system, that was not initially classified as high risk, in such a way that it becomes a high risk AI system. This trigger applies even when no technical modification is made: changing the documented use case alone can flip classification.',
  },
]

const acrossTheLine = [
  {
    title: 'Likely crosses the line',
    items: [
      'Re-training the model on a significantly different dataset',
      'Changing the model architecture or replacing core components',
      'Altering decision thresholds in ways that affect risk profile or accuracy',
      'Adding new use cases the original provider didn\'t anticipate',
      'Modifying the system to extend it into a new Annex III category',
    ],
  },
  {
    title: 'Likely does NOT cross the line',
    items: [
      'Routine security patches that don\'t change capability',
      'UI adjustments that don\'t change the system\'s outputs',
      'Parameter tuning within the documented ranges in the technical file',
      'Bug fixes for known issues already in the provider\'s known-issues list',
      'Configuration changes explicitly foreseen in the instructions for use',
    ],
  },
]

const inheritedObligations = [
  {
    title: 'Risk management system (Article 9)',
    body: 'Establish and maintain a risk management system spanning the entire lifecycle of the high risk AI system.',
  },
  {
    title: 'Data and data governance (Article 10)',
    body: 'Ensure training, validation, and testing data meet quality criteria. Manage representative, relevant, and bias-mitigated datasets.',
  },
  {
    title: 'Technical documentation (Article 11)',
    body: 'Draw up and keep up-to-date technical documentation per Annex IV before placing on the market.',
  },
  {
    title: 'Record-keeping and logs (Article 12)',
    body: 'Design the system to allow automatic recording of logs covering operation, identification of substantial modifications, and risk monitoring.',
  },
  {
    title: 'Transparency and information to deployers (Article 13)',
    body: 'Provide instructions for use that are clear, comprehensive, and sufficient for deployers to comply with their own Article 26 obligations.',
  },
  {
    title: 'Human oversight design (Article 14)',
    body: 'Design and develop the system so that it can be effectively overseen by natural persons.',
  },
  {
    title: 'Accuracy, robustness, cybersecurity (Article 15)',
    body: 'Achieve appropriate levels of accuracy, robustness, and cybersecurity throughout the lifecycle.',
  },
  {
    title: 'Quality management system (Article 17)',
    body: 'Put in place a quality management system to ensure compliance with the Regulation.',
  },
  {
    title: 'Conformity assessment and CE marking',
    body: 'Run the applicable conformity assessment procedure under Article 43, draw up the EU declaration of conformity, affix the CE marking, and register the system in the EU database.',
  },
]

const implementationChecklist = [
  {
    title: 'Map your current modification practice',
    body: 'For each high risk AI system you deploy, document what changes you currently make: re-training cadence, fine-tuning data, threshold adjustments, architecture variations. Confirm each against the provider\'s instructions for use to identify which are foreseen and which are not.',
  },
  {
    title: 'Get explicit "no high risk modification" wording from your providers',
    body: 'Article 25(2) carve-out: the initial provider is not liable for your modifications if it "clearly specified that its AI system is not to be changed into a high-risk AI system." Negotiate this language into your contracts where appropriate. This shifts the analysis onto your shoulders if you do modify, but it also removes ambiguity about provider cooperation duties.',
  },
  {
    title: 'Negotiate written agreements under Article 25(4)',
    body: 'Where you are a high risk provider sourcing components, tools, or services from third parties, written agreements must specify the information, capabilities, technical access, and assistance needed for your compliance. Open-source tools are excluded. The AI Office may publish voluntary contract terms.',
  },
  {
    title: 'Run a modification approval gate',
    body: 'Stand up an internal approval gate for any change to a high risk AI system. The gate asks: is this modification foreseen in the technical file or instructions for use? If no, route to legal/compliance to assess whether it crosses Article 25(1)(b).',
  },
  {
    title: 'Document the analysis',
    body: 'For any modification that lands close to the substantial modification line, document the analysis: what changed, why it does or doesn\'t fall within foreseen modifications, what risk classification analysis was done. This becomes the audit trail if a supervisory authority asks.',
  },
  {
    title: 'Plan for provider transitions',
    body: 'If you do cross the substantial modification line, you become the provider for that modified system. The original provider "shall no longer be considered to be a provider of that specific AI system for the purposes of this Regulation." Your team inherits Article 16 obligations end to end. Have a runbook ready for this transition.',
  },
]

export default function SubstantialModificationPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-white">
      <SiteNav width="4xl">
        <Link href="/assess" className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-lg transition font-medium">
          Assess your AI systems &rarr;
        </Link>
        <ThemeToggle />
      </SiteNav>

      <main className="max-w-4xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="mb-12">
          <div className="flex flex-wrap gap-2 mb-6">
            <span className="inline-flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs px-3 py-1.5 rounded-full font-medium">
              Practical guide
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 text-xs px-3 py-1.5 rounded-full">
              Updated May 18, 2026
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Article 25(1)(b) substantial modification:<br />
            <span className="text-blue-500 dark:text-blue-400">when a deployer becomes a provider</span>
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
            Article 25(1) of the EU AI Act has three triggers that turn a deployer, distributor, importer, or third party
            into a <strong className="text-gray-900 dark:text-white">provider</strong> with the full set of Article 16 obligations.
            Substantial modification is the trigger most often misread in enterprise SaaS contexts where customers
            fine-tune, wrap, or extend the underlying model. Here&rsquo;s where the line sits and what crossing it actually means.
          </p>
        </div>

        {/* Key callout */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 mb-12">
          <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2">The one thing to understand</p>
          <p className="text-gray-900 dark:text-white font-medium text-lg leading-relaxed">
            Substantial modification under Article 3(23) is &ldquo;a change to an AI system after its placing on the market
            or putting into service which is not foreseen or planned in the initial conformity assessment.&rdquo;
            The test is anchored to the conformity assessment scope, not to magnitude. A small change outside the
            initial assessment scope can be substantial. A large change inside the assessment scope is not.
          </p>
        </div>

        {/* The three triggers */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-2">The three triggers under Article 25(1)</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Each trigger independently makes a non-provider into a provider for Regulation purposes.</p>
          <div className="space-y-4">
            {triggers.map((item) => (
              <div key={item.para} className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-6">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-xs font-mono text-blue-600 dark:text-blue-400">{item.para}</span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Where the line sits */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-2">Where the substantial modification line sits</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            Article 3(23) anchors the definition to the initial conformity assessment scope. Changes outside that scope are substantial; changes within it are not.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {acrossTheLine.map((bucket) => (
              <div key={bucket.title} className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{bucket.title}</h3>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  {bucket.items.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="text-blue-500 dark:text-blue-400 shrink-0">&bull;</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-6">
            None of these are absolute rules. The honest answer for borderline cases is: read the provider&rsquo;s technical
            file and instructions for use carefully, and where the change is not clearly foreseen, treat it as substantial
            unless a defensible legal opinion says otherwise. The cost of guessing wrong (you become the provider and
            inherit Article 16 obligations without being prepared) is higher than the cost of one classification review.
          </p>
        </section>

        {/* What you inherit */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-2">What you inherit when you cross the line</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Article 16 lists the obligations attaching to providers of high risk AI systems. Cross the substantial modification line and these all attach to you for the modified system.</p>
          <div className="space-y-3">
            {inheritedObligations.map((item) => (
              <div key={item.title} className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{item.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-6">
            Article 25(1) also makes clear: where the substantial modification trigger fires, the initial provider
            &ldquo;shall no longer be considered to be a provider of that specific AI system for the purposes of this Regulation.&rdquo;
            The compliance baton transfers to you for that modified system. Your existing Article 26 deployer obligations
            still attach (see <Link href="/eu-ai-act-deployer-obligations" className="text-blue-600 dark:text-blue-400 hover:underline">August 2: what attaches for deployers</Link>),
            but the provider stack lands on top.
          </p>
        </section>

        {/* Cooperation duty */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-4">The cooperation duty (Article 25(2))</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            Article 25(2) requires the initial provider to &ldquo;closely cooperate with new providers and shall make
            available the necessary information and provide the reasonably expected technical access and other assistance&rdquo;
            needed for the new provider to comply with the Regulation.
          </p>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            The cooperation duty has an important carve out: it does not apply if the initial provider &ldquo;clearly specified
            that its AI system is not to be changed into a high-risk AI system.&rdquo; In practice this means initial providers
            can disclaim cooperation obligations through clear contractual language stating the system is not intended to be
            modified into high risk territory. If you are the customer and you modify anyway, the provider has no statutory
            duty to help you comply, although your existing contract may still require it.
          </p>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            For enterprise SaaS deployments where modification scope is genuinely uncertain (think model fine-tuning,
            custom guardrails, retrieval augmentation, multi-system orchestration), negotiate the cooperation duty
            explicitly into the contract rather than relying on the statutory baseline.
          </p>
        </section>

        {/* Written agreements requirement */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-4">Written agreements under Article 25(4)</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            Article 25(4) requires that, for high risk AI systems, the provider and any third party supplying tools,
            services, components, or processes used or integrated into the high risk system shall, by written agreement,
            specify the necessary information, capabilities, technical access, and other assistance based on the generally
            acknowledged state of the art.
          </p>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            Two practical points. First, free and open-source tools are excluded from this written agreement requirement,
            which is why some open source AI ecosystems are simpler to integrate from a contracting standpoint.
            Second, the AI Office may develop and recommend voluntary contract terms, which when published will become
            the practical baseline for these agreements.
          </p>
        </section>

        {/* Practical implementation */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-2">Practical implementation</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">A modification governance programme for organisations running high risk AI systems they did not develop themselves.</p>
          <div className="space-y-4">
            {implementationChecklist.map((item, i) => (
              <div key={item.title} className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-5">
                <div className="flex items-start gap-4">
                  <div className="w-7 h-7 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{item.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{item.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Where this matters most */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-4">Where this matters most</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            Article 25(1)(b) lands hardest in enterprise SaaS contexts where customers fine-tune, wrap, or extend a vendor&rsquo;s
            AI system on their own data and deploy it in Annex III use cases. Examples: a customer building an agent on top of
            a process intelligence platform; a hospital fine-tuning a radiology classifier on its own scans; a bank wrapping
            a credit scoring API with its own decision logic; a recruiting platform configuring a job matching algorithm with
            its own scoring weights.
          </p>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            In each of these patterns, the customer&rsquo;s configuration sits in a grey zone between &ldquo;intended use as
            documented&rdquo; (no provider status change) and &ldquo;substantial modification&rdquo; (provider status change).
            The vendor&rsquo;s instructions for use and conformity assessment scope are the controlling documents. If those
            documents do not contemplate the customer&rsquo;s configuration, the customer is on the substantial modification side
            of the line and inherits Article 16 obligations for that deployment.
          </p>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            For deployers running these patterns, the practical posture is: assume substantial modification status by default,
            run a formal classification analysis, and seek explicit contractual language from the vendor either expanding the
            instructions for use to cover your configuration (so it&rsquo;s foreseen) or invoking the Article 25(2) carve out
            (so the vendor disclaims downstream cooperation).
          </p>
        </section>

        {/* CTA */}
        <section className="bg-blue-600 rounded-2xl p-8 text-white text-center mb-12">
          <h2 className="text-2xl font-bold mb-3">Run an Article 25 analysis on your AI configuration</h2>
          <p className="text-blue-100 mb-6 max-w-xl mx-auto">
            ActComply analyses where your specific deployment pattern sits against the substantial modification line.
            Send us one integration pattern and we return a written read on which side of Article 25(1)(b) it lands,
            which Article 16 obligations attach if it crosses, and the contractual language to negotiate with your vendor.
          </p>
          <Link
            href="/assess"
            className="inline-block bg-white text-blue-600 hover:bg-blue-50 font-semibold px-8 py-3 rounded-xl transition"
          >
            Assess your AI systems free &rarr;
          </Link>
          <p className="text-blue-200 text-xs mt-3">No credit card required</p>
        </section>

        {/* Related guides */}
        <RelatedGuides currentSlug="eu-ai-act-substantial-modification" />

        {/* Newsletter signup */}
        <NewsletterSignup
          source="article-25-substantial-modification"
          variant="card"
          heading="More AI Act compliance pieces"
          subheading="Subscribe to Builder&rsquo;s Notes for the next deep dive on EU AI Act compliance. Specific Articles, in plain English. One email when there&rsquo;s something worth saying."
        />

      </main>

      <footer className="border-t border-gray-200 dark:border-white/10 py-8 mt-16">
        <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <span>&copy; 2026 ActComply. Not legal advice.</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-gray-600 dark:hover:text-gray-300 transition">Privacy</Link>
            <Link href="/terms" className="hover:text-gray-600 dark:hover:text-gray-300 transition">Terms</Link>
            <Link href="/eu-ai-act-deployer-obligations" className="hover:text-gray-600 dark:hover:text-gray-300 transition">Deployer obligations</Link>
            <Link href="/eu-ai-act-fria-scope" className="hover:text-gray-600 dark:hover:text-gray-300 transition">FRIA scope</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
