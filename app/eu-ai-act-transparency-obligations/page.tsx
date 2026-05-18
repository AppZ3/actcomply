import Link from 'next/link'
import type { Metadata } from 'next'
import { ThemeToggle } from '@/components/ThemeToggle'
import { NewsletterSignup } from '@/components/NewsletterSignup'
import { RelatedGuides } from '@/components/RelatedGuides'

export const metadata: Metadata = {
  title: 'EU AI Act Article 50 Transparency Obligations — Providers, Deployers, August 2 2026',
  description: 'Article 50 of the EU AI Act splits transparency obligations between providers and deployers across four surface types: AI interaction notices, synthetic content marking, emotion recognition disclosure, and deep fakes. Practical breakdown plus Code of Practice status.',
  alternates: { canonical: 'https://www.getactcomply.com/eu-ai-act-transparency-obligations' },
  openGraph: {
    title: 'EU AI Act Article 50: Transparency Obligations Explained',
    description: 'Four AI surfaces, split provider and deployer obligations, three exceptions. The August 2 transparency checklist for in-house counsel.',
    url: 'https://www.getactcomply.com/eu-ai-act-transparency-obligations',
  },
}

const providerObligations = [
  {
    para: 'Article 50(1)',
    title: 'AI interaction notice',
    body: 'Providers shall design and develop AI systems intended to interact directly with natural persons so that the natural persons concerned are informed that they are interacting with an AI system, unless this is obvious from the point of view of a reasonably well informed natural person. Chatbots, virtual assistants, automated phone systems, AI customer support agents all fall in scope. Exception: AI systems authorised by law to detect, prevent, investigate, or prosecute criminal offences (subject to safeguards).',
  },
  {
    para: 'Article 50(2)',
    title: 'Synthetic content marking',
    body: 'Providers of AI systems (including general purpose AI systems) generating synthetic audio, image, video, or text content shall ensure that the outputs of the AI system are marked in a machine readable format and detectable as artificially generated or manipulated. Technical solutions must be effective, interoperable, robust, and reliable as far as technically feasible, taking into account the specificities and limitations of various content types, the costs of implementation, and the state of the art. Common techniques include watermarks, metadata identifiers, cryptographic methods, logging methods, fingerprints, or combinations. Exception: assistive editing functions that don\'t substantially alter the input, minor alterations, and law enforcement use.',
  },
]

const deployerObligations = [
  {
    para: 'Article 50(3)',
    title: 'Emotion recognition and biometric categorisation disclosure',
    body: 'Deployers of emotion recognition systems or biometric categorisation systems shall inform the natural persons exposed to the operation of the system, and shall process personal data in accordance with GDPR, Regulation (EU) 2018/1725, and Directive (EU) 2016/680, as applicable. Exception: AI systems permitted by law to detect, prevent, or investigate criminal offences (subject to appropriate safeguards).',
  },
  {
    para: 'Article 50(4) deep fakes',
    title: 'Deep fake disclosure',
    body: 'Deployers of AI systems that generate or manipulate image, audio, or video content constituting a deep fake shall disclose that the content has been artificially generated or manipulated. Exception 1: law enforcement use. Exception 2: where the content forms part of an evidently artistic, creative, satirical, fictional, or analogous work, the transparency obligations are limited to disclosing the existence of such generated or manipulated content in an appropriate manner that does not hamper display or enjoyment of the work.',
  },
  {
    para: 'Article 50(4) text on public interest',
    title: 'AI generated text on matters of public interest',
    body: 'Deployers of AI systems that generate or manipulate text published with the purpose of informing the public on matters of public interest shall disclose that the text has been artificially generated or manipulated. Exception 1: law enforcement use. Exception 2: the AI generated content has undergone a process of human review or editorial control and where a natural or legal person holds editorial responsibility for the publication. The editorial responsibility carve out is the most contested line in Article 50: it removes the obligation where there is genuine human editorial oversight, but the threshold for "genuine" is unsettled.',
  },
]

const exceptions = [
  {
    title: 'Law enforcement carve out',
    body: 'Articles 50(1), 50(3), and parts of 50(4) include exceptions where the AI system is authorised by law to detect, prevent, investigate, or prosecute criminal offences, subject to appropriate safeguards for third party rights and freedoms.',
  },
  {
    title: 'Artistic and creative works (deep fakes only)',
    body: 'Where deep fake content forms part of an evidently artistic, creative, satirical, fictional, or analogous work, the disclosure obligation is limited to acknowledging the existence of AI-generated content in a manner that does not hamper display or enjoyment of the work. The full Article 50(4) deep fake disclosure does not apply in the same form.',
  },
  {
    title: 'Human editorial review (text on public interest only)',
    body: 'The Article 50(4) text disclosure obligation does not attach where the AI generated text has undergone human review or editorial control AND a natural or legal person holds editorial responsibility for the publication. This is a two part test, both elements required. Where editorial review is nominal (e.g., automatic publish with no real human gating), the carve out likely does not apply.',
  },
]

const implementationChecklist = [
  {
    title: 'Inventory your AI surfaces',
    body: 'Identify every customer or public facing AI surface: chatbots, virtual assistants, recommender systems, generative content tools, deep fake or synthetic media generators, AI editorial workflows, emotion recognition tools, biometric categorisation tools. Each maps to one or more Article 50 paragraphs.',
  },
  {
    title: 'Classify each surface by paragraph',
    body: 'For each surface, identify whether you are provider, deployer, or both (provider-deployer overlap is common for in-house tools). Map to 50(1) interaction notice, 50(2) synthetic content marking, 50(3) emotion/biometric disclosure, or 50(4) deep fake/text disclosure.',
  },
  {
    title: 'Draft the notice copy',
    body: 'Each in-scope surface needs notice copy compliant with Article 50(5): clear, distinguishable, at the latest at first interaction or exposure, conforming to accessibility requirements. Notices can sit alongside existing GDPR Article 13/14 notices but are separate obligations.',
  },
  {
    title: 'Implement the technical marking (providers of generative AI)',
    body: 'For 50(2), build or procure marking infrastructure: watermarking, metadata identifiers, cryptographic provenance, logging, or fingerprinting. The Code of Practice favours a multilayered approach, not a single technique. Document the choice and rationale.',
  },
  {
    title: 'Document the exception case if relying on one',
    body: 'If invoking the law enforcement, artistic works, or human editorial review exceptions, document the basis explicitly. The editorial review exception in particular needs a documented review workflow that a supervisory authority can audit.',
  },
  {
    title: 'Map interaction with high risk obligations',
    body: 'Article 50(6) clarifies that transparency obligations don\'t override high risk AI obligations. Where a surface is both high risk (Annex III) and Article 50 in scope (e.g., a recommender system used in workforce contexts), you have both layers running.',
  },
  {
    title: 'Track Code of Practice developments',
    body: 'The AI Office published the first draft Code of Practice on Marking and Labelling of AI Generated Content on 17 December 2025, the second draft on 3 March 2026, with the final version expected by June 2026. Adhering to the Code creates a presumption of compliance for providers.',
  },
]

export default function TransparencyObligationsPage() {
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
            <span className="inline-flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs px-3 py-1.5 rounded-full font-medium">
              Practical guide
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 text-xs px-3 py-1.5 rounded-full">
              Updated May 18, 2026
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Article 50 transparency:<br />
            <span className="text-blue-500 dark:text-blue-400">what gets labelled, what doesn&rsquo;t, and what changes August 2</span>
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
            Article 50 of the EU AI Act applies from 2 August 2026. It splits transparency obligations between
            <strong className="text-gray-900 dark:text-white"> providers</strong> and
            <strong className="text-gray-900 dark:text-white"> deployers</strong> across four AI surface types:
            interactive AI systems, synthetic content generators, emotion recognition and biometric categorisation, and deep fakes plus public interest text.
            Here&rsquo;s the practical breakdown, including the three exception lines and the AI Office Code of Practice status.
          </p>
        </div>

        {/* Key callout */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 mb-12">
          <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2">The one thing to understand</p>
          <p className="text-gray-900 dark:text-white font-medium text-lg leading-relaxed">
            Article 50 splits the work. <strong>Providers</strong> own the interaction notice (50(1)) and the synthetic content marking (50(2)).
            <strong> Deployers</strong> own the emotion recognition disclosure (50(3)), the deep fake disclosure (50(4) first part),
            and the AI generated text disclosure on matters of public interest (50(4) second part). If your organisation does both roles
            on the same surface (in-house generative tools, AI editorial workflows), both sets of obligations attach.
          </p>
        </div>

        {/* Provider obligations */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-2">Provider obligations: interaction notice and content marking</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Article 50(1) and 50(2). These bind whoever places the AI system on the market or puts it into service.</p>
          <div className="space-y-4">
            {providerObligations.map((item) => (
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

        {/* Deployer obligations */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-2">Deployer obligations: emotion, biometrics, deep fakes, public interest text</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Article 50(3) and 50(4). These bind whoever puts the system into use under their authority.</p>
          <div className="space-y-4">
            {deployerObligations.map((item) => (
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

        {/* The three exception lines */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-2">The three exception lines</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Article 50 has three distinct exception categories. Don&rsquo;t conflate them: they attach to different paragraphs and have different thresholds.</p>
          <div className="space-y-4">
            {exceptions.map((item) => (
              <div key={item.title} className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Timing and accessibility */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-4">Timing and accessibility (Article 50(5))</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            Article 50(5) sets the bar for how transparency information must reach the affected person.
            Information shall be provided to the natural persons concerned in a clear and distinguishable manner at the latest at the time of the first interaction or exposure.
            The information shall conform to applicable accessibility requirements.
            Practical translation: a notice buried in a privacy policy or a banner that auto-dismisses before the user interacts does not meet 50(5).
          </p>
        </section>

        {/* Interaction with high risk obligations */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-4">Interaction with high risk obligations (Article 50(6))</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            Article 50(6) is a non-derogation clause. The transparency obligations in Article 50 do not affect the requirements
            and obligations set out in other parts of the AI Act for high risk AI systems, and they do not prejudice other Union or national
            transparency obligations for deployers of AI systems.
          </p>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            For deployers running a system that is both high risk under Annex III and in scope of Article 50 (for example, a recommender used in
            workforce management contexts, or a chatbot used in employment), both layers run in parallel. Article 26 deployer obligations
            (see <Link href="/eu-ai-act-deployer-obligations" className="text-blue-600 dark:text-blue-400 hover:underline">August 2: what attaches for deployers</Link>)
            attach independently of Article 50, and where Article 27 FRIA also applies
            (see <Link href="/eu-ai-act-fria-scope" className="text-blue-600 dark:text-blue-400 hover:underline">Article 27 FRIA scope guide</Link>)
            it layers on top again.
          </p>
        </section>

        {/* Code of Practice */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-4">The Code of Practice on Marking and Labelling</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            Article 50(7) tasks the AI Office with encouraging and facilitating the drawing up of codes of practice at Union level to facilitate effective
            implementation of the obligations regarding the detection and labelling of artificially generated or manipulated content.
            The EU Commission also has implementing act powers under Article 50(7).
          </p>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            The AI Office published the first draft Code of Practice on Marking and Labelling of AI Generated Content on 17 December 2025.
            The second draft was published on 3 March 2026. The final version is expected by June 2026, in time for the 2 August 2026 application date.
          </p>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            The Code adopts a multilayered approach to the &ldquo;machine readable&rdquo; marking requirement. Rather than mandating a single technique
            (watermarks alone, or metadata alone), it combines watermarks, metadata identifiers, cryptographic provenance methods, logging,
            and fingerprinting in stacked combinations appropriate to the content type and use case.
          </p>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            Adherence to the final Code of Practice will likely create a presumption of compliance for providers, although the legal weight of that
            presumption depends on the final text and any implementing acts. Until publication, providers should design their marking infrastructure
            to be modular and capable of adopting whichever combination the final Code specifies.
          </p>
        </section>

        {/* Practical implementation */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-2">Practical implementation before August 2</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">The deliverable structure for an Article 50 readiness programme.</p>
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

        {/* Cross link conclusion */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-4">How Article 50 sits within the August 2 stack</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            Article 50 attaches to specific AI surfaces (interactive, generative, emotion/biometric, deep fake or public interest text)
            regardless of whether those surfaces are high risk under Annex III. A consumer chatbot that is not Annex III high risk still owes
            an Article 50(1) interaction notice. A generative AI tool that is not high risk still owes Article 50(2) synthetic content marking.
          </p>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            Where the AI surface is also high risk under Annex III, both Article 26 deployer obligations and Article 50 transparency obligations
            apply in parallel. Where the FRIA threshold is met (public body, public service provider, or credit/insurance pricing AI),
            Article 27 also layers on top. Plan your August 2 readiness work to cover all three intersections.
          </p>
        </section>

        {/* CTA */}
        <section className="bg-blue-600 rounded-2xl p-8 text-white text-center mb-12">
          <h2 className="text-2xl font-bold mb-3">Get the Article 50 readiness analysis for your AI surfaces</h2>
          <p className="text-blue-100 mb-6 max-w-xl mx-auto">
            ActComply runs the Article 50 classification analysis end to end. Send us one AI surface and we return which paragraphs attach,
            which role applies (provider, deployer, or both), whether any exception is available, and a notice copy template that meets the
            Article 50(5) clear and distinguishable bar.
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
        <RelatedGuides currentSlug="eu-ai-act-transparency-obligations" />

        {/* Newsletter signup */}
        <NewsletterSignup
          source="article-50-transparency-obligations"
          variant="card"
          heading="More August 2 readiness pieces"
          subheading="Subscribe to Builder&rsquo;s Notes for the next deep dive on EU AI Act compliance. Specific Articles, in plain English. One email when there&rsquo;s something worth saying."
        />

      </main>

      <footer className="border-t border-gray-200 dark:border-white/10 py-8 mt-16">
        <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <span>&copy; 2026 ActComply. Not legal advice.</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-gray-600 dark:hover:text-gray-300 transition">Privacy</Link>
            <Link href="/terms" className="hover:text-gray-600 dark:hover:text-gray-300 transition">Terms</Link>
            <Link href="/eu-ai-act-fria-scope" className="hover:text-gray-600 dark:hover:text-gray-300 transition">FRIA scope</Link>
            <Link href="/eu-ai-act-deployer-obligations" className="hover:text-gray-600 dark:hover:text-gray-300 transition">Deployer obligations</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
