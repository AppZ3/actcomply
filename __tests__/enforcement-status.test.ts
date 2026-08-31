import { describe, it, expect } from 'vitest'
import { getEnforcementStatus, ENFORCEMENT_MILESTONES } from '../lib/eu-ai-act'

// The landing page renders daysUntilNext on the server and again at hydration.
// If the count were measured from the current instant it could differ between
// the two, so it is measured from UTC midnight and must be stable all day.

describe('getEnforcementStatus', () => {
  it('returns the same day count at any hour of the same UTC day', () => {
    const early = getEnforcementStatus(new Date('2026-08-31T00:00:01Z'))
    const late = getEnforcementStatus(new Date('2026-08-31T23:59:59Z'))
    expect(early.daysUntilNext).toBe(late.daysUntilNext)
    expect(early.next?.key).toBe(late.next?.key)
  })

  it('decrements by exactly one across a UTC day boundary', () => {
    const day1 = getEnforcementStatus(new Date('2026-08-31T12:00:00Z'))
    const day2 = getEnforcementStatus(new Date('2026-09-01T12:00:00Z'))
    expect(day1.daysUntilNext! - day2.daysUntilNext!).toBe(1)
  })

  it('reports enforcement live on and after 2 August 2026', () => {
    expect(getEnforcementStatus(new Date('2026-08-01T23:59:59Z')).enforcementLive).toBe(false)
    expect(getEnforcementStatus(new Date('2026-08-02T00:00:00Z')).enforcementLive).toBe(true)
  })

  it('advances to the next milestone once one passes', () => {
    expect(getEnforcementStatus(new Date('2026-08-31T00:00:00Z')).next?.key).toBe('annex-iii')
    expect(getEnforcementStatus(new Date('2027-12-03T00:00:00Z')).next?.key).toBe('annex-i')
  })

  it('returns no next milestone once every tracked date has passed', () => {
    const after = getEnforcementStatus(new Date('2029-01-01T00:00:00Z'))
    expect(after.next).toBeNull()
    expect(after.daysUntilNext).toBeNull()
    expect(after.enforcementLive).toBe(true)
  })

  it('lists milestones in chronological order', () => {
    const times = ENFORCEMENT_MILESTONES.map(m => m.date.getTime())
    expect([...times].sort((a, b) => a - b)).toEqual(times)
  })
})
