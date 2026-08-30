/**
 * EU AI Act Compliance Rules Engine
 * Based on Regulation (EU) 2024/1689 - enforcement powers in force since August 2, 2026
 *
 * Risk tiers: PROHIBITED > HIGH_RISK > LIMITED_RISK > MINIMAL_RISK
 */

export type RiskLevel = 'PROHIBITED' | 'HIGH_RISK' | 'LIMITED_RISK' | 'MINIMAL_RISK'

export interface ComplianceRequirement {
  id: string
  article: string
  title: string
  description: string
  deadline: string
  effort: 'LOW' | 'MEDIUM' | 'HIGH'
}

export interface AssessmentResult {
  riskLevel: RiskLevel
  riskRationale: string
  regulatoryBasis: string
  requirements: ComplianceRequirement[]
  prohibitedReason?: string
  complianceScore: number // 0-100, based on what user has described having in place
  immediateActions: string[]
  estimatedEffort: string
}

// Prohibited practices under Article 5
export const PROHIBITED_INDICATORS = [
  'social scoring',
  'citizen scoring',
  'government scoring',
  'real-time biometric surveillance',
  'mass biometric surveillance',
  'emotion recognition workplace',
  'emotion recognition education',
  'emotion recognition school',
  'subliminal manipulation',
  'exploit vulnerabilities',
  'exploit children',
  'exploit elderly',
  'predictive policing based on profiling',
  'facial recognition public space',
  'biometric categorisation political',
  'biometric categorisation religious',
  'biometric categorisation sexual orientation',
]

// High-risk categories under Annex III
export const HIGH_RISK_CATEGORIES = [
  {
    category: 'Biometric identification',
    keywords: ['biometric', 'facial recognition', 'fingerprint', 'iris scan', 'voice recognition identity', 'gait recognition'],
  },
  {
    category: 'Critical infrastructure',
    keywords: ['power grid', 'water supply', 'gas network', 'traffic management', 'critical infrastructure'],
  },
  {
    category: 'Education and training',
    keywords: ['student assessment', 'exam grading', 'admission decision', 'educational assessment', 'student monitoring'],
  },
  {
    category: 'Employment and HR',
    keywords: ['recruitment', 'hiring decision', 'cv screening', 'resume screening', 'job applicant', 'worker monitoring', 'performance evaluation employee', 'promotion decision', 'termination decision'],
  },
  {
    category: 'Essential private services',
    keywords: ['credit scoring', 'loan decision', 'insurance pricing', 'insurance underwriting', 'creditworthiness'],
  },
  {
    category: 'Law enforcement',
    keywords: ['law enforcement', 'crime prediction', 'criminal risk', 'polygraph', 'evidence assessment court'],
  },
  {
    category: 'Migration and asylum',
    keywords: ['asylum assessment', 'visa application', 'border control', 'migration risk', 'immigration decision'],
  },
  {
    category: 'Administration of justice',
    keywords: ['judicial decision', 'court decision', 'legal outcome prediction', 'dispute resolution automated'],
  },
]

// High-risk compliance requirements
export const HIGH_RISK_REQUIREMENTS: ComplianceRequirement[] = [
  {
    id: 'risk-mgmt',
    article: 'Article 9',
    title: 'Risk Management System',
    description: 'Establish, implement, document and maintain a risk management system throughout the AI lifecycle. Must identify and analyse known and foreseeable risks, estimate and evaluate risks that may emerge, and adopt risk management measures.',
    deadline: 'Before deployment (Annex III: 2 Dec 2027 | Annex I: 2 Aug 2028)',
    effort: 'HIGH',
  },
  {
    id: 'data-governance',
    article: 'Article 10',
    title: 'Data and Data Governance',
    description: 'Training, validation and testing data must meet quality criteria. Must address relevant design choices, data collection processes, data preparation operations, and examination for biases.',
    deadline: 'Before deployment (Annex III: 2 Dec 2027 | Annex I: 2 Aug 2028)',
    effort: 'HIGH',
  },
  {
    id: 'technical-docs',
    article: 'Article 11 + Annex IV',
    title: 'Technical Documentation',
    description: 'Prepare comprehensive technical documentation before placing on market. Must include general description, detailed description of elements and development process, monitoring/functioning/control information, and validation/testing details.',
    deadline: 'Before deployment (Annex III: 2 Dec 2027 | Annex I: 2 Aug 2028)',
    effort: 'HIGH',
  },
  {
    id: 'logging',
    article: 'Article 12',
    title: 'Record-keeping and Logging',
    description: 'Automatically log events throughout the lifecycle. Logs must enable monitoring of operation, facilitate post-market monitoring, and support investigation of incidents.',
    deadline: 'Before deployment (Annex III: 2 Dec 2027 | Annex I: 2 Aug 2028)',
    effort: 'MEDIUM',
  },
  {
    id: 'transparency',
    article: 'Article 13',
    title: 'Transparency and Information',
    description: 'Ensure AI system is sufficiently transparent. Provide instructions for use including identity of provider, system capabilities and limitations, performance metrics, known risks, and human oversight measures.',
    deadline: 'Before deployment (Annex III: 2 Dec 2027 | Annex I: 2 Aug 2028)',
    effort: 'MEDIUM',
  },
  {
    id: 'human-oversight',
    article: 'Article 14',
    title: 'Human Oversight',
    description: 'Design and develop systems to allow effective human oversight. Humans must be able to fully understand capabilities and limitations, monitor operation, interpret outputs, and override/interrupt/stop the system.',
    deadline: 'Before deployment (Annex III: 2 Dec 2027 | Annex I: 2 Aug 2028)',
    effort: 'HIGH',
  },
  {
    id: 'accuracy-robustness',
    article: 'Article 15',
    title: 'Accuracy, Robustness and Cybersecurity',
    description: 'Achieve appropriate levels of accuracy, robustness, and cybersecurity. Must be resilient to errors, faults, inconsistencies, and adversarial attacks.',
    deadline: 'Before deployment (Annex III: 2 Dec 2027 | Annex I: 2 Aug 2028)',
    effort: 'HIGH',
  },
  {
    id: 'conformity-assessment',
    article: 'Article 43',
    title: 'Conformity Assessment',
    description: 'Conduct conformity assessment before placing on market. Most high-risk AI systems require internal conformity assessment; some require third-party assessment (biometrics, critical infrastructure).',
    deadline: 'Before deployment (Annex III: 2 Dec 2027 | Annex I: 2 Aug 2028)',
    effort: 'HIGH',
  },
  {
    id: 'eu-declaration',
    article: 'Article 47',
    title: 'EU Declaration of Conformity',
    description: 'Draw up written EU declaration of conformity for each high-risk AI system. Must contain information in Annex V and be updated as necessary.',
    deadline: 'Before deployment (Annex III: 2 Dec 2027 | Annex I: 2 Aug 2028)',
    effort: 'LOW',
  },
  {
    id: 'ce-marking',
    article: 'Article 48',
    title: 'CE Marking',
    description: 'Affix CE marking to high-risk AI systems or their documentation to indicate compliance with the regulation.',
    deadline: 'Before deployment (Annex III: 2 Dec 2027 | Annex I: 2 Aug 2028)',
    effort: 'LOW',
  },
  {
    id: 'registration',
    article: 'Article 49',
    title: 'Registration in EU Database',
    description: 'Register high-risk AI system in the EU database before placing on market. Deployers of certain high-risk AI systems must also register.',
    deadline: 'Before deployment (Annex III: 2 Dec 2027 | Annex I: 2 Aug 2028)',
    effort: 'LOW',
  },
  {
    id: 'post-market',
    article: 'Article 72',
    title: 'Post-market Monitoring',
    description: 'Establish and document a post-market monitoring system. Collect, document, and analyse data on performance throughout the lifetime of the system.',
    deadline: 'Ongoing after deployment',
    effort: 'MEDIUM',
  },
]

// General provider obligations (Articles 16–27)
export const GENERAL_PROVIDER_REQUIREMENTS: ComplianceRequirement[] = [
  {
    id: 'quality-management',
    article: 'Article 17',
    title: 'Quality Management System',
    description: 'Providers of high-risk AI systems must implement a quality management system covering strategy, design, development, testing, post-market monitoring, and documentation.',
    deadline: 'Before deployment (Annex III: 2 Dec 2027 | Annex I: 2 Aug 2028)',
    effort: 'HIGH',
  },
  {
    id: 'record-keeping',
    article: 'Article 18',
    title: 'Documentation Retention',
    description: 'Keep technical documentation and quality management records for at least 10 years after the AI system is placed on the market or put into service.',
    deadline: 'Ongoing',
    effort: 'LOW',
  },
  {
    id: 'corrective-actions',
    article: 'Article 20',
    title: 'Corrective Actions and Incident Reporting',
    description: 'Take immediate corrective actions for non-compliant AI systems and inform distributors and deployers. Report serious incidents to relevant market surveillance authorities.',
    deadline: 'Ongoing after deployment',
    effort: 'MEDIUM',
  },
  {
    id: 'authority-cooperation',
    article: 'Article 21',
    title: 'Cooperation with Authorities',
    description: 'Cooperate with competent national authorities upon request. Provide all necessary information and documentation to demonstrate conformity with the regulation.',
    deadline: 'Ongoing',
    effort: 'LOW',
  },
  {
    id: 'deployer-obligations',
    article: 'Article 26',
    title: 'Deployer Obligations',
    description: 'Deployers must use AI systems in accordance with instructions, assign human oversight to competent persons, monitor operation, and report incidents to the provider.',
    deadline: 'Before deployment (Annex III: 2 Dec 2027 | Annex I: 2 Aug 2028)',
    effort: 'MEDIUM',
  },
  {
    id: 'fundamental-rights-impact',
    article: 'Article 27',
    title: 'Fundamental Rights Impact Assessment',
    description: 'Deployers of certain high-risk AI systems must conduct a fundamental rights impact assessment before deployment. Register assessment results in the EU database.',
    deadline: 'Before deployment (Annex III: 2 Dec 2027 | Annex I: 2 Aug 2028)',
    effort: 'HIGH',
  },
]

// GPAI model obligations (Articles 53–55)
export const GPAI_REQUIREMENTS: ComplianceRequirement[] = [
  {
    id: 'gpai-technical-docs',
    article: 'Article 53(1)(a)',
    title: 'GPAI Technical Documentation',
    description: 'Providers of general-purpose AI models must draw up and maintain technical documentation including training process, data used, evaluation results, and energy consumption.',
    deadline: 'Before making available',
    effort: 'HIGH',
  },
  {
    id: 'gpai-instructions',
    article: 'Article 53(1)(b)',
    title: 'GPAI Instructions for Use',
    description: 'Provide information and documentation to downstream providers to enable compliance. Must include capabilities, limitations, and integration guidance.',
    deadline: 'Before making available',
    effort: 'MEDIUM',
  },
  {
    id: 'gpai-copyright-policy',
    article: 'Article 53(1)(c)',
    title: 'Copyright Compliance Policy',
    description: 'Establish a policy to comply with EU copyright law, including reservations of rights by rightsholders under Article 4(3) of Directive 2019/790.',
    deadline: 'Before making available',
    effort: 'MEDIUM',
  },
  {
    id: 'gpai-training-summary',
    article: 'Article 53(1)(d)',
    title: 'Training Data Summary',
    description: 'Publish a sufficiently detailed summary of the content used for training the GPAI model, in accordance with templates provided by the AI Office.',
    deadline: 'Before making available',
    effort: 'MEDIUM',
  },
  {
    id: 'gpai-systemic-risk-eval',
    article: 'Article 55(1)(a)',
    title: 'Systemic Risk Evaluation',
    description: 'Providers of GPAI models with systemic risk must conduct adversarial testing to identify and mitigate systemic risks at EU level.',
    deadline: 'Ongoing',
    effort: 'HIGH',
  },
  {
    id: 'gpai-incident-reporting',
    article: 'Article 55(1)(c)',
    title: 'GPAI Incident Reporting',
    description: 'Report serious incidents and possible corrective measures to the AI Office without undue delay after becoming aware of them.',
    deadline: 'Ongoing after deployment',
    effort: 'MEDIUM',
  },
]

// Limited risk requirements (transparency obligations)
export const LIMITED_RISK_REQUIREMENTS: ComplianceRequirement[] = [
  {
    id: 'chatbot-disclosure',
    article: 'Article 50(1)',
    title: 'Chatbot Disclosure',
    description: 'Users interacting with AI chatbots must be informed they are interacting with an AI system, unless it is obvious from context.',
    deadline: 'Immediately upon deployment',
    effort: 'LOW',
  },
  {
    id: 'deepfake-labelling',
    article: 'Article 50(4)',
    title: 'Synthetic Content Labelling',
    description: 'AI-generated or manipulated image, audio or video content (deepfakes) must be disclosed as artificially generated or manipulated.',
    deadline: 'Immediately upon deployment',
    effort: 'LOW',
  },
  {
    id: 'emotion-disclosure',
    article: 'Article 50(3)',
    title: 'Emotion Recognition Disclosure',
    description: 'Users must be informed when they are subject to emotion recognition or biometric categorisation systems.',
    deadline: 'Immediately upon deployment',
    effort: 'LOW',
  },
]

// ── OMNIBUS AGREEMENT (May 2026) ──────────────────────────────────────────────
// A provisional political agreement was reached in May 2026 extending key deadlines.
// Requires formal adoption by Parliament and Council before taking effect.
// Until formally adopted, treat August 2, 2026 as the operative enforcement date.
//
// AUGUST 2, 2026 , Enforcement powers go live. Prohibited AI + GPAI obligations
//                   enforced. All inventory and classification must be complete.
// DECEMBER 2, 2027, High-risk AI (Annex III standalone systems) full obligations
// AUGUST 2, 2028  , High-risk AI embedded in regulated products (Annex I)

export const ENFORCEMENT_DEADLINE = new Date('2026-08-02T00:00:00Z')
export const OMNIBUS_HIGH_RISK_ANNEX_III_DEADLINE = new Date('2027-12-02T00:00:00Z')
export const OMNIBUS_HIGH_RISK_ANNEX_I_DEADLINE = new Date('2028-08-02T00:00:00Z')

const MS_PER_DAY = 1000 * 60 * 60 * 24

export type MilestoneKey = 'enforcement' | 'annex-iii' | 'annex-i'

export interface EnforcementMilestone {
  key: MilestoneKey
  date: Date
  /** Used in prose, e.g. "Until Annex III high-risk obligations". */
  label: string
  /** Human date for display, e.g. "2 December 2027". */
  displayDate: string
}

// Ordered oldest first. getEnforcementStatus walks this to find what is next.
export const ENFORCEMENT_MILESTONES: EnforcementMilestone[] = [
  {
    key: 'enforcement',
    date: ENFORCEMENT_DEADLINE,
    label: 'Until enforcement powers go live',
    displayDate: '2 August 2026',
  },
  {
    key: 'annex-iii',
    date: OMNIBUS_HIGH_RISK_ANNEX_III_DEADLINE,
    label: 'Until Annex III high-risk obligations',
    displayDate: '2 December 2027',
  },
  {
    key: 'annex-i',
    date: OMNIBUS_HIGH_RISK_ANNEX_I_DEADLINE,
    label: 'Until Annex I embedded-product obligations',
    displayDate: '2 August 2028',
  },
]

export interface EnforcementStatus {
  /** True once enforcement powers are in force (2 August 2026 onwards). */
  enforcementLive: boolean
  /** The next milestone still ahead of us, or null once all have passed. */
  next: EnforcementMilestone | null
  /** Whole days until `next`, or null when there is no next milestone. */
  daysUntilNext: number | null
}

/**
 * The compliance timeline has phases, not one deadline. Copy that hard-codes
 * "days until August 2" goes stale the moment the date passes and cannot be
 * fixed without a deploy, so every surface reads its phase from here instead.
 */
export function getEnforcementStatus(now: Date = new Date()): EnforcementStatus {
  const t = now.getTime()
  const next = ENFORCEMENT_MILESTONES.find(m => m.date.getTime() > t) ?? null
  return {
    enforcementLive: t >= ENFORCEMENT_DEADLINE.getTime(),
    next,
    daysUntilNext: next ? Math.ceil((next.date.getTime() - t) / MS_PER_DAY) : null,
  }
}

/**
 * Days until enforcement powers went live, floored at 0.
 * Retained for the legacy /api/stats field; new surfaces use getEnforcementStatus.
 */
export function getDaysUntilEnforcement(): number {
  const diff = ENFORCEMENT_DEADLINE.getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / MS_PER_DAY))
}

// Total compliance obligations currently defined in this file.
// Derived from all requirement arrays, add items to any array and this updates automatically.
export const REQUIREMENTS_MAPPED =
  HIGH_RISK_REQUIREMENTS.length +
  LIMITED_RISK_REQUIREMENTS.length +
  GENERAL_PROVIDER_REQUIREMENTS.length +
  GPAI_REQUIREMENTS.length
