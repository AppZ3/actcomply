import { describe, it, expect } from 'vitest'
import { computeRisk } from '../lib/screener'

const BASE_HIGH = {
  sector: 'Healthcare' as const,
  decisions_people: true,
  people_per_month: '1000-100000' as const,
  eu_jurisdiction: 'EU-based' as const,
  deployment_stage: 'Live' as const,
  compliance_work_done: 'Nothing' as const,
}

describe('computeRisk', () => {
  it('classifies Annex III sector + decisions affecting people as high risk', () => {
    const result = computeRisk(BASE_HIGH)
    expect(result.tier).toBe('high')
    expect(result.annex_iii_category).toContain('Annex III')
    expect(result.obligations).toHaveLength(3)
    expect(result.urgency_note).toContain('August 2')
  })

  it('classifies Finance + decisions as high risk', () => {
    const result = computeRisk({ ...BASE_HIGH, sector: 'Finance' })
    expect(result.tier).toBe('high')
  })

  it('classifies HR & Recruitment + decisions as high risk', () => {
    const result = computeRisk({ ...BASE_HIGH, sector: 'HR & Recruitment' })
    expect(result.tier).toBe('high')
  })

  it('classifies Other sector as limited risk', () => {
    const result = computeRisk({ ...BASE_HIGH, sector: 'Other' })
    expect(result.tier).toBe('limited')
    expect(result.obligations).toHaveLength(3)
  })

  it('classifies Annex III sector with decisions_people=false as limited risk', () => {
    const result = computeRisk({ ...BASE_HIGH, decisions_people: false })
    expect(result.tier).toBe('limited')
  })

  it('returns urgency note mentioning deployment stage', () => {
    const live = computeRisk(BASE_HIGH)
    expect(live.urgency_note).toContain('live')

    const dev = computeRisk({ ...BASE_HIGH, deployment_stage: 'In development' })
    expect(dev.urgency_note).toContain('development')
  })

  it('treats decisions_people=null as high risk (conservative default)', () => {
    const result = computeRisk({ ...BASE_HIGH, decisions_people: null })
    expect(result.tier).toBe('high')
  })
})
