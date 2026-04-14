// GET /api/stats
// Returns live platform stats for the landing page.
// Called client-side on mount + every 60s to keep numbers fresh.

import { NextResponse } from 'next/server'
import { getDaysUntilEnforcement, REQUIREMENTS_MAPPED } from '@/lib/eu-ai-act'

export const revalidate = 60 // cache for 60s

export async function GET() {
  return NextResponse.json({
    daysUntilEnforcement: getDaysUntilEnforcement(),
    requirementsMapped: REQUIREMENTS_MAPPED,
  })
}
