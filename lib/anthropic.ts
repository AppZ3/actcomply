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

// Retry wrapper with exponential backoff for transient Anthropic API failures
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      const isRetryable =
        err instanceof Anthropic.APIError &&
        (err.status === 429 || err.status === 529 || err.status >= 500)
      if (!isRetryable || attempt === maxRetries - 1) throw err
      await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000))
    }
  }
  throw lastError
}

// Strip common prompt-injection patterns from user-supplied text
function sanitizeInput(text: string): string {
  return text
    .replace(/ignore\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|context)/gi, '[removed]')
    .replace(/system\s*prompt/gi, '[removed]')
    .replace(/you\s+are\s+now\s+/gi, '[removed]')
    .replace(/<\s*\/?(?:system|prompt|instruction)[^>]*>/gi, '[removed]')
    .slice(0, 2000)
}

// Mask common PII patterns before sending user content to the Anthropic API
function maskPII(text: string): string {
  return text
    .replace(/\b[\w.+-]+@[\w-]+\.[a-z]{2,}\b/gi, '[email]')
    .replace(/\b(?:\+?\d[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g, '[phone]')
    .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[card]')
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[ssn]')
}

function prepareInput(text: string): string {
  return maskPII(sanitizeInput(text))
}

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

// Lightweight pre-check before running a full assessment.
// Returns { valid: true } or { valid: false, reason: string }.
export async function validateAssessmentInput(
  system: AISystemInput
): Promise<{ valid: boolean; reason?: string }> {
  const msg = await withRetry(() => client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 128,
    messages: [
      {
        role: 'user',
        content: `You are validating whether a form submission describes a real AI system for an EU AI Act compliance assessment.

Submission:
Name: ${prepareInput(system.name)}
Description: ${prepareInput(system.description)}
Purpose: ${prepareInput(system.purpose)}
Sector: ${prepareInput(system.sector)}

Rules — respond INVALID if any of the following are true:
- The text is gibberish, random characters, or clearly meaningless
- It is obviously a test (e.g. "asdf", "test123", "aaa bbb")
- It does not describe anything that could plausibly be an AI or software system
- The description and purpose are completely unrelated to AI, machine learning, automation, or software
- The text is too vague or short to assess (fewer than 5 meaningful words across all fields combined)

Respond with exactly one word: VALID or INVALID
If INVALID, add a colon and a short user-facing reason (under 15 words), e.g.:
INVALID: Please describe a real AI system — this doesn't look like a valid submission.`,
      },
    ],
  }))

  const text = (msg.content[0] as { type: string; text: string }).text.trim()

  if (text.startsWith('VALID')) return { valid: true }

  const reason = text.includes(':')
    ? text.split(':').slice(1).join(':').trim()
    : 'Please describe a real AI system with enough detail to assess.'

  return { valid: false, reason }
}

export async function assessAISystem(
  system: AISystemInput,
  context?: { userId?: string; assessmentId?: string }
): Promise<AssessmentResult> {
  const systemText = `
    System Name: ${prepareInput(system.name)}
    Description: ${prepareInput(system.description)}
    Purpose: ${prepareInput(system.purpose)}
    Sector: ${prepareInput(system.sector)}
    Uses personal data: ${system.usesPersonalData}
    Makes autonomous decisions: ${system.makesAutonomousDecisions}
    Affects individuals: ${system.affectsIndividuals}
    Current safeguards in place: ${prepareInput(system.currentSafeguards ?? '')}
  `

  const startedAt = Date.now()
  const message = await withRetry(() => client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1024,
    system: [
      {
        type: 'text',
        text: `You are an expert in EU AI Act compliance (Regulation EU 2024/1689). You analyse AI systems and provide structured compliance assessments.

CURRENT REGULATORY TIMELINE (as of May 2026):
- August 2, 2026: Enforcement powers go live. Prohibited AI (Article 5) and GPAI obligations (Articles 53-55) are enforced. All organisations must complete AI inventory and classification by this date.
- December 2, 2027: Full obligations for high-risk AI systems (Annex III standalone systems) — per the Omnibus provisional agreement reached May 2026, pending formal adoption.
- August 2, 2028: Full obligations for high-risk AI embedded in regulated products (Annex I) — per Omnibus.
- Until the Omnibus is formally adopted by Parliament and Council, treat August 2, 2026 as the operative date for all obligations.

PROHIBITED INDICATORS TO CHECK:
${PROHIBITED_INDICATORS.join(', ')}

HIGH-RISK CATEGORIES TO CHECK:
${HIGH_RISK_CATEGORIES.map(c => `${c.category}: ${c.keywords.join(', ')}`).join('\n')}

Provide your assessment in the following JSON format exactly:
{
  "riskLevel": "PROHIBITED" | "HIGH_RISK" | "LIMITED_RISK" | "MINIMAL_RISK",
  "riskRationale": "Clear explanation of why this risk level was assigned, including which deadline applies under the current Omnibus timeline",
  "regulatoryBasis": "Specific articles/annexes that apply",
  "prohibitedReason": "Only if PROHIBITED - explain exactly which prohibition applies",
  "complianceScore": 0-100 (based on safeguards already described - 0 means nothing in place, 100 means fully compliant),
  "immediateActions": ["Array of 3-5 most urgent specific actions this company must take, noting that inventory and classification must be complete by August 2, 2026 regardless of risk level"],
  "estimatedEffort": "Realistic estimate e.g. '2-4 weeks with 1 compliance officer' or '3-6 months requiring legal counsel'"
}

Be precise, reference actual article numbers, and be conservative — if unsure, classify higher risk. Return only valid JSON, no markdown.`,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: `Analyse this AI system:\n\n${systemText}` }],
  }))

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

  const result: AssessmentResult = {
    riskLevel,
    riskRationale: parsed.riskRationale,
    regulatoryBasis: parsed.regulatoryBasis,
    requirements,
    prohibitedReason: parsed.prohibitedReason,
    complianceScore: parsed.complianceScore,
    immediateActions: parsed.immediateActions,
    estimatedEffort: parsed.estimatedEffort,
  }

  // Write AI decision audit log entry (best-effort, never block the response)
  if (context?.userId) {
    const { getSupabaseAdmin } = await import('./supabase-admin')
    const admin = getSupabaseAdmin()
    admin.from('audit_log').insert({
      user_id: context.userId,
      assessment_id: context.assessmentId ?? null,
      action: 'ai_assessment',
      detail: {
        model: 'claude-opus-4-6',
        risk_level: riskLevel,
        compliance_score: parsed.complianceScore,
        latency_ms: Date.now() - startedAt,
        input_tokens: message.usage.input_tokens,
        output_tokens: message.usage.output_tokens,
      },
    }).then(() => {}, () => {})
  }

  return result
}
