import Anthropic from '@anthropic-ai/sdk'
import {
  HIGH_RISK_CATEGORIES,
  HIGH_RISK_REQUIREMENTS,
  LIMITED_RISK_REQUIREMENTS,
  type ComplianceRequirement,
  PROHIBITED_INDICATORS,
  type AssessmentResult,
  type RiskLevel,
} from './eu-ai-act'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface AISystemInput {
  name: string
  description: string
  purpose: string
  sector: string
  usesPersonalData: boolean
  makesAutonomousDecisions: boolean
  affectsIndividuals: boolean
  currentSafeguards: string
}

export async function assessAISystem(system: AISystemInput): Promise<AssessmentResult> {
  const systemText = `
    System Name: ${system.name}
    Description: ${system.description}
    Purpose: ${system.purpose}
    Sector: ${system.sector}
    Uses personal data: ${system.usesPersonalData}
    Makes autonomous decisions: ${system.makesAutonomousDecisions}
    Affects individuals: ${system.affectsIndividuals}
    Current safeguards in place: ${system.currentSafeguards}
  `

  const prompt = `You are an expert in EU AI Act compliance (Regulation EU 2024/1689). Analyse the following AI system and provide a structured compliance assessment.

AI SYSTEM TO ASSESS:
${systemText}

PROHIBITED INDICATORS TO CHECK:
${PROHIBITED_INDICATORS.join(', ')}

HIGH-RISK CATEGORIES TO CHECK:
${HIGH_RISK_CATEGORIES.map(c => `${c.category}: ${c.keywords.join(', ')}`).join('\n')}

Provide your assessment in the following JSON format exactly:
{
  "riskLevel": "PROHIBITED" | "HIGH_RISK" | "LIMITED_RISK" | "MINIMAL_RISK",
  "riskRationale": "Clear explanation of why this risk level was assigned",
  "regulatoryBasis": "Specific articles/annexes that apply",
  "prohibitedReason": "Only if PROHIBITED - explain exactly which prohibition applies",
  "complianceScore": 0-100 (based on safeguards already described - 0 means nothing in place, 100 means fully compliant),
  "immediateActions": ["Array of 3-5 most urgent specific actions this company must take"],
  "estimatedEffort": "Realistic estimate e.g. '2-4 weeks with 1 compliance officer' or '3-6 months requiring legal counsel'"
}

Be precise, reference actual article numbers, and be conservative - if unsure, classify higher risk. Do not include markdown formatting, return only valid JSON.`

  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = message.content[0]
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude')
  }

  const raw = content.text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/,'').trim()
  const parsed = JSON.parse(raw)
  const riskLevel: RiskLevel = parsed.riskLevel

  // Attach the relevant requirements based on risk level
  let requirements: ComplianceRequirement[] = []
  if (riskLevel === 'HIGH_RISK') {
    requirements = HIGH_RISK_REQUIREMENTS
  } else if (riskLevel === 'LIMITED_RISK') {
    requirements = LIMITED_RISK_REQUIREMENTS
  }

  return {
    riskLevel,
    riskRationale: parsed.riskRationale,
    regulatoryBasis: parsed.regulatoryBasis,
    requirements,
    prohibitedReason: parsed.prohibitedReason,
    complianceScore: parsed.complianceScore,
    immediateActions: parsed.immediateActions,
    estimatedEffort: parsed.estimatedEffort,
  }
}
