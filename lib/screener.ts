export type Sector = 'Healthcare' | 'Finance' | 'HR & Recruitment' | 'Critical Infrastructure' | 'Education' | 'Other'
export type RiskTier = 'high' | 'limited'

// All fields are persisted by the API handler. Only sector and decisions_people affect the current risk tier.
export interface ScreenerAnswers {
  sector: Sector
  decisions_people: boolean | null
  people_per_month: '<1000' | '1000-100000' | '>100000'
  eu_jurisdiction: 'EU-based' | 'Non-EU serves EU' | 'Both'
  deployment_stage: 'Live' | 'In development'
  compliance_work_done: 'Nothing' | 'Some internal review' | 'Formal assessment started'
}

export interface ScreenerResult {
  tier: RiskTier
  annex_iii_category: string | null
  obligations: string[]
  urgency_note: string
}

const ANNEX_III_SECTORS = new Set<Sector>(['Healthcare', 'Finance', 'HR & Recruitment', 'Critical Infrastructure', 'Education'])

const SECTOR_ANNEX: Record<string, string> = {
  Healthcare: 'Annex III §5(a): AI systems used in medical devices',
  Finance: 'Annex III §5(b): AI in creditworthiness and insurance risk',
  'HR & Recruitment': 'Annex III §4: AI in employment and worker management',
  'Critical Infrastructure': 'Annex III §2: Safety components in critical infrastructure',
  Education: 'Annex III §3: AI in education and vocational training',
}

const HIGH_OBLIGATIONS = [
  'Article 9: Establish and maintain a risk management system throughout the AI lifecycle',
  'Article 11: Prepare technical documentation before deployment and keep it current',
  'Article 13: Ensure transparency so users know they are interacting with an AI system and understand its limitations',
]

const LIMITED_OBLIGATIONS = [
  'Article 50: Disclose AI interaction to users of chatbots or synthetic media generators',
  'Article 53: General-purpose AI model obligations apply if your model is made publicly available',
  'Article 6: Re-verify classification if your deployment scale or use case expands',
]

const DEADLINE = new Date('2026-08-02')

export function computeRisk(answers: ScreenerAnswers): ScreenerResult {
  const MS_PER_DAY = 86_400_000
  const daysLeft = Math.max(0, Math.ceil((DEADLINE.getTime() - Date.now()) / MS_PER_DAY))
  const isHighRisk = ANNEX_III_SECTORS.has(answers.sector) && answers.decisions_people !== false

  if (isHighRisk) {
    const complianceStatus = answers.compliance_work_done === 'Nothing'
      ? 'you have not started compliance work'
      : answers.compliance_work_done === 'Some internal review'
        ? 'you have done some internal review'
        : 'a formal assessment is in progress'

    const stageNote = answers.deployment_stage === 'Live'
      ? `Your system is live and ${complianceStatus}.`
      : `Your system is in development and must be compliant before you deploy.`

    return {
      tier: 'high',
      annex_iii_category: SECTOR_ANNEX[answers.sector] ?? null,
      obligations: HIGH_OBLIGATIONS,
      urgency_note: `${stageNote} The August 2 enforcement deadline is ${daysLeft} days away.`,
    }
  }

  return {
    tier: 'limited',
    annex_iii_category: null,
    obligations: LIMITED_OBLIGATIONS,
    urgency_note: `Your system falls under Article 50 transparency obligations. ${answers.deployment_stage === 'Live' ? 'These apply now.' : 'These apply from the date you deploy.'}`,
  }
}
