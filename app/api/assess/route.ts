import { NextRequest, NextResponse } from 'next/server'
import { assessAISystem, type AISystemInput } from '@/lib/anthropic'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const body: AISystemInput = await request.json()

    if (!body.name || !body.description || !body.purpose || !body.sector) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, purpose, sector' },
        { status: 400 }
      )
    }

    // Run the assessment
    const result = await assessAISystem(body)

    // If user is logged in, check plan limits and save
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan, systems_limit')
        .eq('id', user.id)
        .single()

      const limit = profile?.systems_limit ?? 1

      if (limit !== -1) {
        const { count } = await supabase
          .from('assessments')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)

        if ((count ?? 0) >= limit) {
          return NextResponse.json(
            { error: `Your ${profile?.plan ?? 'current'} plan allows up to ${limit} saved system${limit === 1 ? '' : 's'}. Upgrade to assess more.` },
            { status: 403 }
          )
        }
      }

      // Save assessment
      const { data: saved, error: saveError } = await supabase
        .from('assessments')
        .insert({
          user_id: user.id,
          name: body.name,
          description: body.description,
          purpose: body.purpose,
          sector: body.sector,
          uses_personal_data: body.usesPersonalData,
          makes_autonomous_decisions: body.makesAutonomousDecisions,
          affects_individuals: body.affectsIndividuals,
          current_safeguards: body.currentSafeguards,
          risk_level: result.riskLevel,
          compliance_score: result.complianceScore,
          risk_rationale: result.riskRationale,
          regulatory_basis: result.regulatoryBasis,
          requirements: result.requirements,
          prohibited_reason: result.prohibitedReason ?? null,
          immediate_actions: result.immediateActions,
          estimated_effort: result.estimatedEffort,
        })
        .select('id')
        .single()

      if (saveError) {
        console.error('Failed to save assessment:', saveError.message)
      }

      return NextResponse.json({ ...result, savedId: saved?.id ?? null })
    }

    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Assessment error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
