import Link from 'next/link'
import type { Metadata } from 'next'
import { ThemeToggle } from '@/components/ThemeToggle'
import { NewsletterSignup } from '@/components/NewsletterSignup'

export const metadata: Metadata = {
  title: 'Article 27 FRIA: Who It Actually Applies To (EU AI Act Scope Guide)',
  description: 'Article 27 Fundamental Rights Impact Assessment under the EU AI Act does not apply to every Annex III high-risk system. Here is the actual scope, the public-service classification trap, and what fills the gap when FRIA does not attach.',
  alternates: { canonical: 'https://www.getactcomply.com/eu-ai-act-fria-scope' },
  openGraph: {
    title: 'Article 27 FRIA: Who It Actually Applies To',
    description: 'The Article 27 FRIA scope is narrower than most teams assume. Practical guide to who is in, who is out, and what fills the gap.',
    url: 'https://www.getactcomply.com/eu-ai-act-fria-scope',
  },
}

const sgeiIncludes = [
  'Utilities (electricity, water, gas, waste management)',
  'Telecommunications, especially universal service obligation providers',
  'Postal services',
  'Healthcare (with significant Member State variation on private hospital classification)',
  'Public transport, definitionally narrower than all transport',
  'Social services and housing in some jurisdictions',
  'Education in some jurisdictions',
]

const sgeiExcludes = [
  'E-commerce platforms',
  'Food delivery and quick commerce',
  'Meal kits and online grocery',
  'SaaS for private business use',
  'Streaming and entertainment',
  'Most travel and hospitality',
  'Adtech and digital advertising platforms',
]

const friaInputs = [
  {
    title: 'Description of deployer processes',
    quote: 'A description of the deployer’s processes in which the high-risk AI system will be used in line with its intended purpose.',
  },
  {
    title: 'Period and frequency of use',
    quote: 'A description of the period of time within which, and the frequency with which, each high-risk AI system is intended to be used.',
  },
  {
    title: 'Categories of affected persons and groups',
    quote: 'The categories of natural persons and groups likely to be affected by its use in the specific context.',
  },
  {
    title: 'Specific risks of harm',
    quote: 'The specific risks of harm likely to have an impact on the categories of natural persons or groups.',
  },
  {
    title: 'Human oversight measures',
    quote: 'A description of the implementation of human oversight measures, according to the instructions for use.',
  },
  {
    title: 'Risk materialisation response',
    quote: 'The measures to be taken in the case of the materialisation of those risks, including the arrangements for internal governance and complaint mechanisms.',
  },
]

export default function FriaScopePage() {
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
              Assess your AI systems →
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
            Article 27 FRIA:<br />
            <span className="text-blue-500 dark:text-blue-400">who it actually applies to, and what fills the gap when it doesn&rsquo;t</span>
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
            Most teams preparing for August 2 assume the Article 27 Fundamental Rights Impact Assessment applies to every high risk system in Annex III. It doesn&rsquo;t.
            Here&rsquo;s the actual scope, the public service classification trap, and what fills the gap when FRIA technically doesn&rsquo;t attach.
          </p>
        </div>

        {/* Key callout */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 mb-12">
          <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2">The one thing to understand</p>
          <p className="text-gray-900 dark:text-white font-medium text-lg leading-relaxed">
            Article 27 FRIA scope is a UNION of three groups: public bodies, private entities providing public services,
            and any deployer of creditworthiness or insurance pricing AI. If you are not in one of those three groups,
            Article 27 does not directly attach to you, even when your AI system is high risk under Annex III.
          </p>
        </div>

        {/* Section 1: The scope */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-4">The scope (the bit most teams miss)</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            Article 27(1) of the EU AI Act says, in full:
          </p>
          <blockquote className="border-l-4 border-blue-500/40 pl-4 italic text-gray-600 dark:text-gray-400 mb-6">
            &ldquo;Prior to deploying a high-risk AI system referred to in Article 6(2), with the exception of high-risk AI systems intended to be used in the area listed in point 2 of Annex III, deployers that are bodies governed by public law, or are private entities providing public services, and deployers of high-risk AI systems referred to in points 5 (b) and (c) of Annex III, shall perform an assessment of the impact on fundamental rights...&rdquo;
          </blockquote>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            Parsed for clarity, that&rsquo;s a union of three groups:
          </p>
          <ol className="list-decimal pl-6 space-y-2 text-gray-700 dark:text-gray-300 mb-6">
            <li>Public bodies deploying any high risk system (with critical infrastructure excluded under the Annex III point 2 carve out)</li>
            <li>Private entities providing public services deploying any high risk system</li>
            <li>Any deployer, public or private, of creditworthiness scoring (Annex III 5(b)) or life and health insurance risk assessment and pricing (Annex III 5(c)) AI</li>
          </ol>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            A common misreading is to assume Article 27 attaches to every Annex III high risk system. It doesn&rsquo;t.
            A private company deploying workforce management AI (Annex III point 4) is not directly subject to Article 27
            unless that company provides public services. Article 26 deployer obligations attach regardless. FRIA specifically does not.
          </p>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            This matters because the Article 27 obligations are non trivial: a structured assessment with six required inputs,
            notification to the market surveillance authority, and a documented mitigation framework. Doing one is real work.
            Doing one because you assumed you had to, when you didn&rsquo;t, wastes counsel hours and creates documentation that doesn&rsquo;t actually
            map to a specific legal obligation.
          </p>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            The reverse mistake is worse: assuming you&rsquo;re exempt because you&rsquo;re private, when in fact your service falls
            within the public service definition. That risks both compliance exposure and the reputational cost of being seen
            to dodge the requirement.
          </p>
        </section>

        {/* Section 2: The public service trap */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-4">The &ldquo;private entity providing public services&rdquo; trap</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            The AI Act doesn&rsquo;t define &ldquo;public services.&rdquo; That sounds technical but it&rsquo;s the most important sentence
            in this article. The whole question of who&rsquo;s in and who&rsquo;s out of Group 2 turns on a term the Regulation leaves to interpretation.
          </p>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            EU law context helps. &ldquo;Public services&rdquo; most closely maps to Services of General Economic Interest (SGEI) under
            Articles 14 and 106(2) of the Treaty on the Functioning of the European Union. SGEI typically includes:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300 mb-6">
            {sgeiIncludes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">What&rsquo;s typically NOT a public service under EU law:</p>
          <ul className="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300 mb-6">
            {sgeiExcludes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            The ride hailing gray zone deserves its own paragraph. The Court of Justice has held that platform ride hailing is a transport service,
            not an information society service (Case C-434/15, Asoci&aacute;ci&oacute;n Profesional Elite Taxi v Uber Systems Spain, 20 December 2017).
            That makes it regulable under Member State transport law. But &ldquo;transport service&rdquo; doesn&rsquo;t automatically equal &ldquo;public service.&rdquo;
            Some Member States license VTC operators in ways that make them look like SGEI providers (Spain, France, parts of Germany).
            Others treat them as purely private commercial actors. The Article 27 status of a ride hailing platform deploying driver allocation AI
            is genuinely undecided in most jurisdictions and may require local legal opinion.
          </p>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            The practical implication: if you&rsquo;re uncertain whether your operation falls within &ldquo;private entity providing public services,&rdquo;
            get a written opinion before the August 2 trigger date. Don&rsquo;t guess. The cost of guessing wrong in either direction is substantial.
          </p>
        </section>

        {/* Section 3: What attaches even when FRIA doesn't */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-4">What attaches even when FRIA doesn&rsquo;t</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
            Three things every Annex III high risk system deployer faces, regardless of public service status, from August 2:
          </p>

          <div className="space-y-4 mb-6">
            <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Article 26 deployer obligations</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                Universal across all Annex III categories. Cover technical and organisational measures aligned to provider instructions,
                human oversight by competent natural persons, input data relevance and representativeness, operational monitoring per provider instructions,
                automatic log retention for at least six months, worker notification before workplace deployment, DPIA coordination under GDPR Article 35,
                and authority cooperation. Not optional, no carve out for private commercial actors.
              </p>
            </div>
            <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">GDPR Article 35 DPIA</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                Already applies to high risk processing of personal data. Most high risk AI systems trigger this independent of the AI Act.
                Article 27(3) of the AI Act provides that where the FRIA obligations are already met through the DPIA, the FRIA &ldquo;shall complement&rdquo; the DPIA.
                So even if FRIA technically doesn&rsquo;t attach to you, the DPIA you&rsquo;re already required to do under GDPR will cover much of the same ground.
              </p>
            </div>
            <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">National workforce rules</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                Where the high risk system manages workers, Member State law often imposes algorithmic transparency obligations that mirror FRIA in substance.
                Spain&rsquo;s Ley Rider (Royal Decree-Law 9/2021, amending Article 64.4(d) of the Workers&rsquo; Statute) requires platforms to inform
                worker representatives of the parameters, rules and instructions on which algorithms or AI systems are based when they influence working conditions,
                access to or maintenance of employment, and profiling. Germany&rsquo;s Works Constitution Act (BetrVG) gives works councils co-determination rights
                over technical equipment intended to monitor employee behaviour or performance (&sect; 87(1)(6)), which the Federal Labour Court has interpreted
                broadly enough to cover AI based monitoring. The 2021 Works Council Modernization Act (Betriebsr&auml;temodernisierungsgesetz) added explicit AI
                provisions at &sect; 80(3) (expert consultation), &sect; 90(1) (planning information), and &sect; 95(2a) (AI in personnel selection guidelines).
                The Platform Work Directive (Directive (EU) 2024/2831, with transposition deadline 2 December 2026) will harmonise much of this across the EU,
                including a presumption of employment for platform workers and mandatory transparency obligations for algorithmic management.
              </p>
            </div>
          </div>

          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            Net effect: most non public service deployers facing workforce AI obligations will end up doing a FRIA equivalent voluntarily,
            because Article 26 plus GDPR Article 35 plus national workforce rules effectively require the same analytical work.
            The Article 27 question becomes &ldquo;do we have to file this with the market surveillance authority and structure it precisely
            the way Article 27(1) prescribes&rdquo; rather than &ldquo;do we have to do the underlying work at all.&rdquo;
          </p>
        </section>

        {/* Section 4: When to do voluntarily */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-4">When to do a FRIA voluntarily</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
            Three reasons even non public service deployers may want to do a FRIA voluntarily:
          </p>
          <div className="space-y-4 mb-6">
            <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Customer or partner contract triggers</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                Enterprise customers, especially regulated entities (banks, healthcare providers, public sector buyers), increasingly require their
                vendors to demonstrate AI Act preparation. A completed FRIA is a clean artefact to share. A patchwork of separate DPIA documents
                and informal risk notes is harder to defend in due diligence.
              </p>
            </div>
            <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Future regulation alignment</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                Article 27(5) requires the AI Office to develop a template questionnaire (potentially including an automated tool) to help deployers
                comply in a simplified manner. When that template is issued, the practical scope and application of the FRIA will sharpen.
                Separately, Member State transpositions of the Platform Work Directive (deadline 2 December 2026) will introduce algorithmic management
                transparency requirements that overlap significantly with FRIA in substance.
              </p>
            </div>
            <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Internal risk management</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                FRIA forces a structured walk through risks of harm to specific affected categories. That&rsquo;s good practice independent of regulatory
                requirement. Many internal AI risk frameworks already converge on a structure with similar inputs.
              </p>
            </div>
          </div>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            The cost of voluntary compliance is real but bounded by the scope of one system at a time. Voluntary compliance becomes attractive
            when that cost is less than the expected cost of being wrong about scope.
          </p>
        </section>

        {/* Section 5: The template */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-4">The Article 27 FRIA template</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
            The six inputs Article 27(1) requires, in the order the Regulation specifies them:
          </p>
          <ol className="space-y-3 mb-6">
            {friaInputs.map((input, i) => (
              <li key={input.title} className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-5">
                <div className="flex items-start gap-4">
                  <div className="w-7 h-7 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{input.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm italic leading-relaxed">&ldquo;{input.quote}&rdquo;</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            Article 27(2) requires notification of the assessment results to the market surveillance authority of the Member State of deployment.
          </p>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
            Article 27(3) provides that where the underlying obligations are already met through the GDPR Article 35 DPIA, the FRIA &ldquo;shall complement&rdquo;
            the DPIA (avoiding duplicate work without merging the two documents).
          </p>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6">
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2">Working template</p>
            <p className="text-gray-900 dark:text-white leading-relaxed mb-4">
              Until the AI Office publishes the official questionnaire under Article 27(5), a working one page template covering these six inputs
              (structured for both Article 27 filing and voluntary use) is available here:
            </p>
            <Link
              href="/eu-ai-act-fria-template"
              className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 py-2.5 rounded-lg transition"
            >
              Open the FRIA template (PDF download) &rarr;
            </Link>
          </div>
        </section>

        {/* Section 6: What this means for Aug 2 */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-4">What this means for August 2</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            If your organisation is a public body or provides public services, Article 27 attaches to every Annex III deployment you run.
            Start the assessment now.
          </p>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            If your organisation is a private commercial actor in food delivery, meal kits, SaaS, travel, e-commerce, or adtech, Article 27
            does not directly attach unless your specific AI deployment falls under Annex III 5(b) or 5(c) (creditworthiness or insurance pricing).
            Article 26 still attaches. So does GDPR Article 35 DPIA. So do applicable national workforce rules.
            The voluntary FRIA question is then a strategic one.
          </p>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
            If your organisation operates in ride hailing, transport adjacent services, healthcare adjacent services, or the platform worker space more broadly,
            get a written legal opinion on the public service classification question for each Member State you operate in.
            The answer is jurisdiction specific and the cost of getting it wrong is asymmetric.
          </p>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            The honest summary: Article 27 FRIA scope is one of the corners of the EU AI Act where the scope language is easy to misread
            in either direction. The cost of getting it wrong is real either way.
          </p>
        </section>

        {/* CTA */}
        <section className="bg-blue-600 rounded-2xl p-8 text-white text-center mb-12">
          <h2 className="text-2xl font-bold mb-3">Know whether Article 27 attaches to your AI systems</h2>
          <p className="text-blue-100 mb-6 max-w-xl mx-auto">
            ActComply runs the Article 27 scope check and the Article 26 deployer classification analysis end to end.
            Send us one AI surface and we return a written read on which obligations attach, how the FRIA scope analysis applies
            to your specific organisational status, and what mitigation work the deadline requires.
          </p>
          <Link
            href="/assess"
            className="inline-block bg-white text-blue-600 hover:bg-blue-50 font-semibold px-8 py-3 rounded-xl transition"
          >
            Assess your AI systems free &rarr;
          </Link>
          <p className="text-blue-200 text-xs mt-3">No credit card required</p>
        </section>

        {/* Newsletter signup */}
        <NewsletterSignup
          source="article-27-fria-scope"
          variant="card"
          heading="Next piece: Article 26 deployer obligations"
          subheading="&ldquo;August 2: what attaches for deployers&rdquo; covers the universally attaching Article 26 obligations in operational detail. One email when it&rsquo;s out."
        />

      </main>

      <footer className="border-t border-gray-200 dark:border-white/10 py-8 mt-16">
        <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <span>&copy; 2026 ActComply. Not legal advice.</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-gray-600 dark:hover:text-gray-300 transition">Privacy</Link>
            <Link href="/terms" className="hover:text-gray-600 dark:hover:text-gray-300 transition">Terms</Link>
            <Link href="/eu-ai-act-compliance-checklist" className="hover:text-gray-600 dark:hover:text-gray-300 transition">Full checklist</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
