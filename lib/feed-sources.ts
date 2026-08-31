/**
 * The newsletter's inbound feed list.
 *
 * Every URL here was fetched and confirmed to return real RSS or Atom before
 * being added. Four obvious candidates were rejected because their advertised
 * feed URLs serve HTML: IAPP, techpolicy.press, Brookings and DataGuidance.
 * Euractiv and Lawfare return 403 to server-side fetches. If you add a source,
 * fetch it first and check it parses.
 *
 * `tier` drives curation, not filtering. Tier 1 is on-topic by definition and
 * a mildly interesting item still earns a place. Tier 3 is general tech and
 * policy press where most items are irrelevant, so an item has to be clearly
 * about AI regulation to survive scoring.
 */

export interface FeedSource {
  /** Stable id, stored on every item. Renaming one orphans its history. */
  key: string
  name: string
  url: string
  /** 1 = directly about the Act, 2 = policy orgs that cover it, 3 = general press. */
  tier: 1 | 2 | 3
}

export const FEED_SOURCES: FeedSource[] = [
  // Tier 1, directly on topic.
  {
    key: 'ai-act-eu',
    name: 'EU Artificial Intelligence Act',
    url: 'https://artificialintelligenceact.eu/feed/',
    tier: 1,
  },
  {
    key: 'ec-digital-strategy',
    name: 'European Commission, Shaping Europe’s digital future',
    url: 'https://digital-strategy.ec.europa.eu/en/rss.xml',
    tier: 1,
  },
  {
    key: 'ec-presscorner',
    name: 'European Commission press releases',
    url: 'https://ec.europa.eu/commission/presscorner/api/rss?language=en',
    tier: 1,
  },

  // Tier 2, policy and digital-rights organisations that cover the Act closely.
  {
    key: 'algorithmwatch',
    name: 'AlgorithmWatch',
    url: 'https://algorithmwatch.org/en/feed/',
    tier: 2,
  },
  {
    key: 'noyb',
    name: 'noyb',
    url: 'https://noyb.eu/en/rss.xml',
    tier: 2,
  },
  {
    key: 'cdt',
    name: 'Center for Democracy and Technology',
    url: 'https://cdt.org/feed/',
    tier: 2,
  },
  {
    key: 'epic',
    name: 'Electronic Privacy Information Center',
    url: 'https://epic.org/feed/',
    tier: 2,
  },
  {
    key: 'fpf',
    name: 'Future of Privacy Forum',
    url: 'https://fpf.org/feed/',
    tier: 2,
  },

  // Tier 3, general tech and policy press. Mostly noise, occasionally first to
  // a story that matters. Scoring has to earn these a place.
  {
    key: 'politico-eu',
    name: 'Politico Europe',
    url: 'https://www.politico.eu/feed/',
    tier: 3,
  },
  {
    key: 'wired-ai',
    name: 'WIRED, AI',
    url: 'https://www.wired.com/feed/tag/ai/latest/rss',
    tier: 3,
  },
  {
    key: 'mit-tech-review',
    name: 'MIT Technology Review',
    url: 'https://www.technologyreview.com/feed/',
    tier: 3,
  },
  {
    key: 'ars-technica',
    name: 'Ars Technica',
    url: 'https://feeds.arstechnica.com/arstechnica/technology-lab',
    tier: 3,
  },
  {
    key: 'eff',
    name: 'Electronic Frontier Foundation',
    url: 'https://www.eff.org/rss/updates.xml',
    tier: 3,
  },
]
