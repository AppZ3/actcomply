/**
 * The SEO publishing backlog.
 *
 * The cron at /api/cron/seo-builder walks this list in order and publishes the
 * first topic that does not already exist in `seo_pages`. Adding a topic here
 * is the whole editorial workflow: one commit, reviewable in a diff, and the
 * page appears the next morning.
 *
 * Keep `slug` in the same shape the write path normalises to: lowercase,
 * hyphen-separated, no trailing hyphens.
 */

export interface SeoTopic {
  slug: string
  /** Working title. The writer may improve on it, within the length rules. */
  title: string
  /** What this page has to cover that the others do not. Steers the draft. */
  angle: string
}

export const SEO_TOPICS: SeoTopic[] = [
  // Carried over from the August batch the cloud routine never managed to publish.
  {
    slug: 'eu-ai-act-portugal',
    title: 'EU AI Act in Portugal: national authority and enforcement',
    angle: 'Which Portuguese body supervises the Act, how national implementation sits alongside the Regulation, and what a Portuguese startup does first.',
  },
  {
    slug: 'eu-ai-act-czech-republic',
    title: 'EU AI Act in the Czech Republic: supervision and next steps',
    angle: 'Czech national competent authority, notification duties, and the practical first move for a Prague-based AI company.',
  },
  {
    slug: 'eu-ai-act-denmark',
    title: 'EU AI Act in Denmark: supervision and next steps',
    angle: 'Danish market surveillance arrangements and how they interact with existing Danish data protection supervision.',
  },
  {
    slug: 'eu-ai-act-finland',
    title: 'EU AI Act in Finland: supervision and next steps',
    angle: 'Finnish authority structure, and the sandbox provisions Finland has signalled it will run.',
  },
  {
    slug: 'eu-ai-act-romania',
    title: 'EU AI Act in Romania: supervision and next steps',
    angle: 'Romanian implementation status and what an outsourcing or services company operating from Romania needs to know.',
  },
  {
    slug: 'eu-ai-act-sandbox-startups',
    title: 'EU AI Act regulatory sandboxes for startups',
    angle: 'Article 57 to 62 sandboxes: who can apply, what relief they actually give, and whether they are worth a startup pursuing.',
  },
  {
    slug: 'eu-ai-act-gpai-code-of-practice',
    title: 'The GPAI Code of Practice and what signing it means',
    angle: 'What the Code of Practice covers, whether signing is voluntary, and how it changes the evidence burden for a GPAI provider.',
  },
  {
    slug: 'eu-ai-act-incident-reporting',
    title: 'EU AI Act serious incident reporting under Article 73',
    angle: 'What counts as a serious incident, the reporting clock, who you report to, and the internal process that has to exist beforehand.',
  },
  {
    slug: 'eu-ai-act-iso-42001',
    title: 'ISO 42001 and EU AI Act compliance: what overlaps',
    angle: 'Where an ISO 42001 management system maps onto Act obligations, and precisely which gaps it does not close.',
  },
  {
    slug: 'eu-ai-act-proptech-compliance',
    title: 'Proptech AI and EU AI Act compliance',
    angle: 'Tenant screening, valuation models and access control: which proptech uses fall into Annex III and which do not.',
  },

  // Post-enforcement angles. These only became worth writing once the
  // 2 August 2026 date passed, which is most of the point of them.
  {
    slug: 'eu-ai-act-enforcement-has-started',
    title: 'EU AI Act enforcement has started: where you stand now',
    angle: 'What changed on 2 August 2026 in practice, what supervisory authorities can do from today, and the honest position of a company that has done nothing yet.',
  },
  {
    slug: 'eu-ai-act-late-compliance-catch-up',
    title: 'Starting EU AI Act compliance late: a catch-up plan',
    angle: 'A realistic sequence for a company beginning after the deadline, ordered by exposure rather than by article number.',
  },
  {
    slug: 'eu-ai-act-market-surveillance-authorities',
    title: 'EU AI Act market surveillance authorities and their powers',
    angle: 'What a market surveillance authority can request, inspect and order, and what a document request looks like in practice.',
  },
  {
    slug: 'eu-ai-act-annex-iii-december-2027',
    title: 'Annex III high-risk obligations and the December 2027 date',
    angle: 'What the Omnibus extension did and did not move, and why the extra time is not as much time as it sounds for a conformity assessment.',
  },
  {
    slug: 'eu-ai-act-ai-literacy-training',
    title: 'EU AI Act AI literacy obligations: building the training',
    angle: 'Article 4 in operational terms: who needs training, what it has to cover, and what evidence of it a regulator would accept.',
  },
  {
    slug: 'eu-ai-act-vendor-due-diligence',
    title: 'EU AI Act due diligence on AI vendors',
    angle: 'What a deployer must obtain from a provider, the contract terms worth insisting on, and how to assess a vendor claiming compliance.',
  },
]
