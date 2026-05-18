import Link from 'next/link'
import type { Metadata } from 'next'
import { ThemeToggle } from '@/components/ThemeToggle'
import { NewsletterSignup } from '@/components/NewsletterSignup'

export const metadata: Metadata = {
  title: 'EU AI Act GPAI Provider Obligations — Article 53, 55, and the Code of Practice',
  description: 'GPAI provider obligations under EU AI Act Articles 53 and 55 entered force 2 August 2025; enforcement starts 2 August 2026. Practical breakdown of technical documentation, downstream information, copyright policy, training data summary, systemic risk obligations, and the GPAI Code of Practice.',
  alternates: { canonical: 'https://www.getactcomply.com/eu-ai-act-gpai-provider-obligations' },
  openGraph: {
    title: 'EU AI Act GPAI Provider Obligations Explained',
    description: 'Article 53 + 55 obligations, the 10^25 FLOP systemic-risk threshold, the July 2025 Code of Practice, and what model developers actually need to do.',
    url: 'https://www.getactcomply.com/eu-ai-act-gpai-provider-obligations',
  },
}

const article53Obligations = [
  {
    para: 'Article 53(1)(a)',
    title: 'Technical documentation',
    body: 'Draw up and keep up to date the technical documentation of the model, including its training and testing process and the results of its evaluation. Minimum elements are specified in Annex XI. The documentation must be available on request to the AI Office and to national competent authorities.',
  },
  {
    para: 'Article 53(1)(b)',
    title: 'Information for downstream providers',
    body: 'Provide documentation enabling AI system providers that intend to integrate the GPAI model into their AI systems to understand the model\'s capabilities and limitations and to comply with their own Regulation obligations. Minimum elements are specified in Annex XII. The documentation should support downstream conformity assessments and Article 13 transparency obligations.',
  },
  {
    para: 'Article 53(1)(c)',
    title: 'Copyright compliance policy',
    body: 'Put in place a policy to comply with Union copyright law, including identifying and respecting the rights reservations expressed by rightsholders under Article 4(3) of Directive (EU) 2019/790 (the DSM Directive). The policy must address text and data mining opt outs and provide a procedure for honouring them.',
  },
  {
    para: 'Article 53(1)(d)',
    title: 'Training data summary',
    body: 'Draw up and make publicly available a sufficiently detailed summary about the content used for training the GPAI model, following a template provided by the AI Office. The template is intended to enable rightsholders to identify whether their content was used and to exercise their rights.',
  },
]

const article55Obligations = [
  {
    para: 'Article 55(1)(a)',
    title: 'Model evaluation and adversarial testing',
    body: 'Perform model evaluation in accordance with standardised protocols and tools reflecting the state of the art, including conducting and documenting adversarial testing of the model with a view to identifying and mitigating systemic risks.',
  },
  {
    para: 'Article 55(1)(b)',
    title: 'Systemic risk assessment and mitigation',
    body: 'Assess and mitigate possible systemic risks at Union level, including their sources, that may stem from the development, the placing on the market, or the use of the GPAI model with systemic risk.',
  },
  {
    para: 'Article 55(1)(c)',
    title: 'Serious incident reporting',
    body: 'Keep track of, document, and report, without undue delay, to the AI Office and, as appropriate, to national competent authorities, relevant information about serious incidents and possible corrective measures to address them.',
  },
  {
    para: 'Article 55(1)(d)',
    title: 'Cybersecurity protection',
    body: 'Ensure an adequate level of cybersecurity protection for the GPAI model with systemic risk and the physical infrastructure of the model.',
  },
]

const implementationChecklist = [
  {
    title: 'Confirm GPAI classification',
    body: 'Article 3(63) defines a GPAI model as one that displays significant generality and is capable of competently performing a wide range of distinct tasks. Models below that threshold (narrow models for a single task) are not GPAI. Confirm your model qualifies before applying Article 53.',
  },
  {
    title: 'Run the Article 51 systemic-risk threshold check',
    body: 'Article 51 presumes systemic risk where cumulative training compute exceeds 10^25 floating point operations. This is a rebuttable presumption: a provider above the threshold can contest the designation by demonstrating absence of high impact capabilities. As of mid 2026, the threshold captures roughly 5 to 15 providers worldwide.',
  },
  {
    title: 'Adopt or evaluate the GPAI Code of Practice',
    body: 'The General-Purpose AI Code of Practice was published by the AI Office on 10 July 2025, organised into three chapters: Transparency, Copyright, and Safety and Security. Signing the Code is voluntary, but the Commission and AI Board have confirmed it as an adequate compliance tool. Signing creates a presumption of compliance and reduces administrative burden compared to demonstrating compliance through other means.',
  },
  {
    title: 'Build the Annex XI technical documentation',
    body: 'For Article 53(1)(a), draw up technical documentation covering training and testing processes, evaluation results, and the elements specified in Annex XI. The documentation must be ready on request from the AI Office.',
  },
  {
    title: 'Build the Annex XII downstream documentation',
    body: 'For Article 53(1)(b), create the documentation that downstream AI system providers will need to integrate your model into their systems compliantly. This is separate from the Annex XI documentation, with different content scope.',
  },
  {
    title: 'Stand up the copyright opt-out honouring process',
    body: 'Build a process to identify and honour text and data mining opt outs under DSM Directive Article 4(3). This typically involves crawler-respecting robots.txt directives, header signals, and a takedown process for content that should not have been included in training.',
  },
  {
    title: 'Publish the training data summary',
    body: 'For Article 53(1)(d), draft a public summary of training content following the AI Office template. The summary should be detailed enough to enable rightsholders to identify whether their content was used.',
  },
  {
    title: 'Appoint an EU representative (non-EU providers)',
    body: 'Article 54 requires GPAI providers established outside the EU to appoint, prior to placing their model on the EU market, an authorised representative established in the Union. The representative is a contact point for the AI Office and handles regulatory cooperation.',
  },
]

export default function GpaiProviderObligationsPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-white">
      <nav className="border-b border-gray-200 dark:border-white/10 bg-white dark:bg-gray-950 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-sm text-white">AI</div>
            <span className="font-semibold text-lg">ActComply</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/assess" className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-lg transition font-medium">
              Assess your AI systems &rarr;
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="mb-12">
          <div className="flex flex-wrap gap-2 mb-6">
            <span className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs px-3 py-1.5 rounded-full font-medium">
              In force since August 2, 2025
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 text-xs px-3 py-1.5 rounded-full">
              Updated May 18, 2026
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            EU AI Act GPAI provider obligations:<br />
            <span className="text-blue-500 dark:text-blue-400">what model developers actually need to do</span>
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
            GPAI provider obligations under Articles 53 and 55 of the EU AI Act entered force on
            <strong className="text-gray-900 dark:text-white"> 2 August 2025</strong>. Active enforcement begins
            <strong className="text-gray-900 dark:text-white"> 2 August 2026</strong>. The Code of Practice was published
            10 July 2025. Here&rsquo;s the practical breakdown of what providers of general purpose AI models must do.
          </p>
        </div>

        {/* Key callout */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 mb-12">
          <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2">The one thing to understand</p>
          <p className="text-gray-900 dark:text-white font-medium text-lg leading-relaxed">
            GPAI obligations are split in two tiers. Article 53 applies to <strong>all</strong> providers of GPAI models:
            technical documentation, downstream provider information, copyright policy, training data summary.
            Article 55 layers on top for providers of <strong>GPAI models with systemic risk</strong>: those above the
            10^25 FLOP training threshold (Article 51). Adopting the AI Office Code of Practice (10 July 2025) is voluntary
            but the cleanest path to demonstrating compliance for both tiers.
          </p>
        </div>

        {/* Who is a GPAI provider */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-4">Who is a GPAI provider</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            Article 3(63) defines a general purpose AI model as &ldquo;an AI model, including where such an AI model is trained
            with a large amount of data using self-supervision at scale, that displays significant generality and is capable of
            competently performing a wide range of distinct tasks, regardless of the way the model is placed on the market and
            that can be integrated into a variety of downstream systems or applications.&rdquo;
          </p>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            A provider, under Article 3(3), is the entity that develops the model and places it on the market under its own name
            or trademark. The full set of European and major US foundation model labs are GPAI providers in this sense.
            European examples include Mistral AI (France), Aleph Alpha (Germany), Black Forest Labs (Germany), and DeepL (Germany).
            Major non-EU providers placing models on the EU market also fall within scope, with the additional Article 54 EU
            representative requirement.
          </p>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            Narrow task-specific models (a credit scoring model, a single-purpose translation model trained for one language pair,
            a specialised radiology classifier) are not GPAI within the meaning of Article 3(63) and fall outside Articles 53 and 55,
            although they may be high risk under Annex III in their own right.
          </p>
        </section>

        {/* Article 53 obligations */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-2">Article 53: obligations for all GPAI providers</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Four core duties that attach to every GPAI provider regardless of systemic risk classification.</p>
          <div className="space-y-4">
            {article53Obligations.map((item) => (
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

        {/* Open source exception */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-4">The open source exception (Article 53(2))</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            Article 53(2) carves out two of the four Article 53(1) obligations for providers of GPAI models released under a
            free and open source licence that allows access, use, modification, and distribution of the model, and whose parameters
            (including weights), information on model architecture, and information on model usage are publicly available.
          </p>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            Specifically, the technical documentation obligation (53(1)(a)) and the downstream provider information obligation (53(1)(b))
            do not apply to genuinely open source GPAI providers. The copyright policy obligation (53(1)(c)) and the training data summary
            obligation (53(1)(d)) still apply.
          </p>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            Important: the open source exception does not apply to GPAI models with systemic risk under Article 55. A model above
            the 10^25 FLOP threshold released under an open source licence still owes the full Article 55 obligation set, and a
            stricter reading of the Article 53 obligations is required given the systemic risk classification.
          </p>
        </section>

        {/* EU representative requirement */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-4">EU representative requirement (Article 54)</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            Article 54 requires that providers of GPAI models established outside the EU shall, prior to placing a GPAI model on
            the Union market, appoint by written mandate an authorised representative established in the Union.
          </p>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            The EU representative is the contact point for the AI Office and national competent authorities. The representative
            holds copies of the technical documentation, the relevant information enabling compliance verification, and the contact
            details of the provider.
          </p>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            The Article 54 obligation has no open source exception. Even genuinely open source GPAI providers established outside
            the EU must appoint a representative before placing models on the Union market. This is one of the cleanest obligations
            to address operationally and one of the easiest to overlook.
          </p>
        </section>

        {/* Article 55 systemic risk obligations */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-2">Article 55: additional obligations for GPAI with systemic risk</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Four further duties that layer on top of Article 53 for providers of GPAI models classified as systemic risk under Article 51.</p>
          <div className="space-y-4">
            {article55Obligations.map((item) => (
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

        {/* The 10^25 FLOP threshold */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-4">The 10^25 FLOP systemic-risk threshold (Article 51)</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            Article 51 establishes a rebuttable presumption that a GPAI model has high impact capabilities (and therefore systemic risk)
            when the cumulative amount of computation used for its training measured in floating point operations is greater than 10^25.
          </p>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            As of mid 2026, this threshold captures roughly 5 to 15 providers worldwide: the largest US labs (OpenAI, Anthropic,
            Google DeepMind, Meta for some Llama models), a handful of Chinese labs, and at the European margin the most advanced
            frontier model providers. The Commission can adjust the threshold and add supplementary benchmarks through delegated
            acts as the field evolves.
          </p>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            The presumption is rebuttable. A provider above the FLOP threshold may contest the designation by demonstrating that
            the model lacks the capabilities that make it systemic risk. The procedure for contesting designation runs through the
            AI Office. A provider below the threshold may still be designated as systemic risk by the Commission based on a different
            indicator set, though in practice this has been used sparingly.
          </p>
        </section>

        {/* GPAI Code of Practice */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-4">The GPAI Code of Practice (Article 56)</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            Article 56 mandates the AI Office to facilitate codes of practice to help providers of GPAI models comply with
            Articles 53 et seq. The General-Purpose AI Code of Practice was published by the AI Office on
            <strong className="text-gray-900 dark:text-white"> 10 July 2025</strong>, organised into three chapters:
            Transparency, Copyright, and Safety and Security.
          </p>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            The first two chapters apply to all GPAI providers. The third (Safety and Security) applies only to providers of GPAI
            models with systemic risk under Article 55. Signing the Code is voluntary, but the European Commission and the AI Board
            have confirmed it as an adequate compliance tool. Signing creates a presumption of compliance and reduces administrative
            burden compared to demonstrating compliance through bespoke documentation.
          </p>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            For most GPAI providers, the practical position is: sign the Code, build compliance against its specific provisions,
            and treat any non-Code compliance pathways as fallback options. Providers that choose not to sign should be prepared
            to demonstrate equivalent compliance to the AI Office, with the burden of proof effectively reversed.
          </p>
        </section>

        {/* Practical implementation */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-2">Practical implementation</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">A readiness programme for GPAI providers preparing for active enforcement on 2 August 2026.</p>
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

        {/* Where this fits */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-4">Where this fits in the AI Act stack</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            GPAI provider obligations sit at the top of the AI value chain. Downstream deployers using your GPAI model in their AI
            systems carry their own obligations: Article 26 deployer duties (see{' '}
            <Link href="/eu-ai-act-deployer-obligations" className="text-blue-600 dark:text-blue-400 hover:underline">August 2: what attaches for deployers</Link>),
            Article 27 FRIA where they qualify (see{' '}
            <Link href="/eu-ai-act-fria-scope" className="text-blue-600 dark:text-blue-400 hover:underline">Article 27 FRIA scope</Link>),
            Article 50 transparency where applicable (see{' '}
            <Link href="/eu-ai-act-transparency-obligations" className="text-blue-600 dark:text-blue-400 hover:underline">Article 50 transparency</Link>),
            and substantial modification triggers if they wrap or fine-tune your model significantly (see{' '}
            <Link href="/eu-ai-act-substantial-modification" className="text-blue-600 dark:text-blue-400 hover:underline">Article 25(1)(b) substantial modification</Link>).
          </p>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            Your Article 53 documentation is what enables downstream deployers to do their own compliance work. The quality and
            structure of that documentation directly shapes the friction your customers face in their own AI Act readiness programmes.
            A well-built Annex XII downstream documentation pack is a competitive advantage in the enterprise procurement process,
            not just a compliance artefact.
          </p>
        </section>

        {/* CTA */}
        <section className="bg-blue-600 rounded-2xl p-8 text-white text-center mb-12">
          <h2 className="text-2xl font-bold mb-3">Run a GPAI Article 53 readiness check</h2>
          <p className="text-blue-100 mb-6 max-w-xl mx-auto">
            ActComply maps your GPAI model against the full Article 53 obligation set (and Article 55 if systemic risk applies),
            identifies which Code of Practice provisions cover your specific compliance posture, and returns a gap analysis with
            a remediation path before 2 August 2026 enforcement.
          </p>
          <Link
            href="/assess"
            className="inline-block bg-white text-blue-600 hover:bg-blue-50 font-semibold px-8 py-3 rounded-xl transition"
          >
            Assess your GPAI model free &rarr;
          </Link>
          <p className="text-blue-200 text-xs mt-3">No credit card required</p>
        </section>

        {/* Newsletter signup */}
        <NewsletterSignup
          source="article-53-gpai-provider-obligations"
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
            <Link href="/eu-ai-act-substantial-modification" className="hover:text-gray-600 dark:hover:text-gray-300 transition">Substantial modification</Link>
            <Link href="/eu-ai-act-deployer-obligations" className="hover:text-gray-600 dark:hover:text-gray-300 transition">Deployer obligations</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
