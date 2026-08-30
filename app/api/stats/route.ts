// GET /api/stats
// Returns live platform stats for the landing page.
// Called client-side on mount + every 60s to keep numbers fresh.

import { NextResponse } from 'next/server'
import { getDaysUntilEnforcement, getEnforcementStatus, REQUIREMENTS_MAPPED } from '@/lib/eu-ai-act'

export const revalidate = 60 // cache for 60s

export async function GET() {
  const status = getEnforcementStatus()

  return NextResponse.json({
    enforcementLive: status.enforcementLive,
    nextMilestone: status.next
      ? {
          key: status.next.key,
          label: status.next.label,
          displayDate: status.next.displayDate,
          daysUntil: status.daysUntilNext,
        }
      : null,
    requirementsMapped: REQUIREMENTS_MAPPED,
    // Legacy field, floors at 0 once enforcement powers are live.
    daysUntilEnforcement: getDaysUntilEnforcement(),
  })
}
