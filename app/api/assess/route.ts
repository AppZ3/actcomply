import { NextRequest, NextResponse } from 'next/server'
import { assessAISystem, validateAssessmentInput, type AISystemInput } from '@/lib/anthropic'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { logError } from '@/lib/error-logger'

export async function POST(request: NextRequest) {
  try {
    const body: AISystemInput & { prefillId?: string } = await request.json()
    const { prefillId, ...assessmentInput } = body

    if (!assessmentInput.name || !assessmentInput.description || !assessmentInput.purpose || !assessmentInput.sector) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, purpose, sector' },
        { status: 400 }
      )
    }

    // Validate input before running the full assessment
    const validation = await validateAssessmentInput(assessmentInput)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.reason }, { status: 422 })
    }

    // Resolve user before assessment so we can pass context for audit logging
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Run the assessment
    const result = await assessAISystem(assessmentInput, { userId: user?.id })

    // Log anonymised event for analytics (no PII)
    getSupabaseAdmin().from('assessment_events').insert({
      sector: assessmentInput.sector,
      risk_level: result.riskLevel,
      uses_personal_data: assessmentInput.usesPersonalData,
      makes_autonomous_decisions: assessmentInput.makesAutonomousDecisions,
      affects_individuals: assessmentInput.affectsIndividuals,
      is_authenticated: !!user,
    }).then(() => {}, () => {})

    // If user is logged in, check plan limits and save
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

      const assessmentData = {
        name: assessmentInput.name,
        description: assessmentInput.description,
        purpose: assessmentInput.purpose,
        sector: assessmentInput.sector,
        uses_personal_data: assessmentInput.usesPersonalData,
        makes_autonomous_decisions: assessmentInput.makesAutonomousDecisions,
        affects_individuals: assessmentInput.affectsIndividuals,
        current_safeguards: assessmentInput.currentSafeguards,
        risk_level: result.riskLevel,
        compliance_score: result.complianceScore,
        risk_rationale: result.riskRationale,
        regulatory_basis: result.regulatoryBasis,
        requirements: result.requirements,
        prohibited_reason: result.prohibitedReason ?? null,
        immediate_actions: result.immediateActions,
        estimated_effort: result.estimatedEffort,
      }

      let savedId: string | null = null

      if (prefillId) {
        // Re-assess: update existing record (verify ownership first)
        const { data: updated, error: updateError } = await supabase
          .from('assessments')
          .update(assessmentData)
          .eq('id', prefillId)
          .eq('user_id', user.id)
          .select('id')
          .single()
        if (updateError) console.error('Failed to update assessment:', updateError.message)
        savedId = updated?.id ?? prefillId
      } else {
        // New assessment: insert
        const { data: saved, error: saveError } = await supabase
          .from('assessments')
          .insert({ user_id: user.id, ...assessmentData })
          .select('id')
          .single()
        if (saveError) console.error('Failed to save assessment:', saveError.message)
        savedId = saved?.id ?? null
      }

      return NextResponse.json({ ...result, savedId })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Assessment error:', error instanceof Error ? error.stack : String(error))
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = user
      ? await supabase.from('profiles').select('email, plan').eq('id', user.id).single()
      : { data: null }
    await logError(error, {
      route: 'POST /api/assess',
      userId: user?.id,
      userEmail: profile?.email,
      userPlan: profile?.plan,
      context: {},
    })
    return NextResponse.json({ error: 'Assessment failed. Please try again.' }, { status: 500 })
  }
}
