/**
 * EU AI Act Compliance Rules Engine
 * Based on Regulation (EU) 2024/1689 - fully in force August 2, 2026
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
    deadline: 'Before deployment',
    effort: 'HIGH',
  },
  {
    id: 'data-governance',
    article: 'Article 10',
    title: 'Data and Data Governance',
    description: 'Training, validation and testing data must meet quality criteria. Must address relevant design choices, data collection processes, data preparation operations, and examination for biases.',
    deadline: 'Before deployment',
    effort: 'HIGH',
  },
  {
    id: 'technical-docs',
    article: 'Article 11 + Annex IV',
    title: 'Technical Documentation',
    description: 'Prepare comprehensive technical documentation before placing on market. Must include general description, detailed description of elements and development process, monitoring/functioning/control information, and validation/testing details.',
    deadline: 'Before deployment',
    effort: 'HIGH',
  },
  {
    id: 'logging',
    article: 'Article 12',
    title: 'Record-keeping and Logging',
    description: 'Automatically log events throughout the lifecycle. Logs must enable monitoring of operation, facilitate post-market monitoring, and support investigation of incidents.',
    deadline: 'Before deployment',
    effort: 'MEDIUM',
  },
  {
    id: 'transparency',
    article: 'Article 13',
    title: 'Transparency and Information',
    description: 'Ensure AI system is sufficiently transparent. Provide instructions for use including identity of provider, system capabilities and limitations, performance metrics, known risks, and human oversight measures.',
    deadline: 'Before deployment',
    effort: 'MEDIUM',
  },
  {
    id: 'human-oversight',
    article: 'Article 14',
    title: 'Human Oversight',
    description: 'Design and develop systems to allow effective human oversight. Humans must be able to fully understand capabilities and limitations, monitor operation, interpret outputs, and override/interrupt/stop the system.',
    deadline: 'Before deployment',
    effort: 'HIGH',
  },
  {
    id: 'accuracy-robustness',
    article: 'Article 15',
    title: 'Accuracy, Robustness and Cybersecurity',
    description: 'Achieve appropriate levels of accuracy, robustness, and cybersecurity. Must be resilient to errors, faults, inconsistencies, and adversarial attacks.',
    deadline: 'Before deployment',
    effort: 'HIGH',
  },
  {
    id: 'conformity-assessment',
    article: 'Article 43',
    title: 'Conformity Assessment',
    description: 'Conduct conformity assessment before placing on market. Most high-risk AI systems require internal conformity assessment; some require third-party assessment (biometrics, critical infrastructure).',
    deadline: 'Before deployment',
    effort: 'HIGH',
  },
  {
    id: 'eu-declaration',
    article: 'Article 47',
    title: 'EU Declaration of Conformity',
    description: 'Draw up written EU declaration of conformity for each high-risk AI system. Must contain information in Annex V and be updated as necessary.',
    deadline: 'Before deployment',
    effort: 'LOW',
  },
  {
    id: 'ce-marking',
    article: 'Article 48',
    title: 'CE Marking',
    description: 'Affix CE marking to high-risk AI systems or their documentation to indicate compliance with the regulation.',
    deadline: 'Before deployment',
    effort: 'LOW',
  },
  {
    id: 'registration',
    article: 'Article 49',
    title: 'Registration in EU Database',
    description: 'Register high-risk AI system in the EU database before placing on market. Deployers of certain high-risk AI systems must also register.',
    deadline: 'Before deployment',
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

// Total compliance obligations mapped across the EU AI Act (Regulation EU 2024/1689).
// Counts: high-risk requirements × each Annex III sector + limited-risk obligations +
// GPAI model obligations (Articles 53-55) + general provider obligations (Articles 16-27)
// Update this number when new requirement categories are added to this file.
export const ENFORCEMENT_DEADLINE = new Date('2026-08-02T00:00:00Z')

export function getDaysUntilEnforcement(): number {
  const diff = ENFORCEMENT_DEADLINE.getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export const REQUIREMENTS_MAPPED =
  HIGH_RISK_REQUIREMENTS.length * HIGH_RISK_CATEGORIES.length + // per-sector high-risk obligations
  LIMITED_RISK_REQUIREMENTS.length +                            // transparency obligations
  14 +                                                          // GPAI model obligations (Art 53-55)
  12                                                            // general provider obligations (Art 16-27)
