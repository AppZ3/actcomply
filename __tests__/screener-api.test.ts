import { describe, it, expect } from 'vitest'

const BASE_URL = process.env.TEST_BASE_URL || 'https://getactcomply.com'

const validPayload = {
  sector: 'Finance',
  decisions_people: true,
  people_per_month: '1000-100000',
  eu_jurisdiction: 'EU-based',
  deployment_stage: 'Live',
  compliance_work_done: 'Nothing',
  _hp: '',
}

describe('POST /api/screener', () => {
  it('returns risk tier and obligations for a valid payload', async () => {
    const res = await fetch(`${BASE_URL}/api/screener`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validPayload),
    })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.tier).toBe('high')
    expect(Array.isArray(data.obligations)).toBe(true)
    expect(data.obligations).toHaveLength(3)
    expect(data.clause_paragraph).toBeTypeOf('string')
    expect(data.clause_paragraph.length).toBeGreaterThan(50)
    expect(data.lead_id).toBeTypeOf('string')
  }, 30_000)

  it('silently accepts honeypot-filled submissions but ignores them', async () => {
    const res = await fetch(`${BASE_URL}/api/screener`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validPayload, _hp: 'bot-filled' }),
    })
    expect(res.status).toBe(200)
  }, 10_000)

  it('returns 400 for invalid email format', async () => {
    const res = await fetch(`${BASE_URL}/api/screener`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validPayload, email: 'not-an-email' }),
    })
    expect(res.status).toBe(400)
  }, 10_000)
})
