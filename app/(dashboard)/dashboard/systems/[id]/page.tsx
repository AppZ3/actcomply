import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import type { RiskLevel, ComplianceRequirement } from '@/lib/eu-ai-act'

const RISK_CONFIG: Record<RiskLevel, { label: string; color: string; bg: string }> = {
  PROHIBITED:   { label: 'PROHIBITED',    color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20' },
  HIGH_RISK:    { label: 'HIGH RISK',     color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
  LIMITED_RISK: { label: 'LIMITED RISK',  color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  MINIMAL_RISK: { label: 'MINIMAL RISK',  color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20' },
}

export default async function SystemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: assessment } = await supabase
    .from('assessments')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!assessment) notFound()

  const config = RISK_CONFIG[assessment.risk_level as RiskLevel]
  const requirements = (assessment.requirements ?? []) as ComplianceRequirement[]
  const immediateActions = (assessment.immediate_actions ?? []) as string[]

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard/systems" className="text-sm text-gray-400 hover:text-white transition">
          ← AI Systems
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">{assessment.name}</h1>
          <p className="text-gray-400 text-sm">{assessment.sector} · Assessed {new Date(assessment.created_at).toLocaleDateString()}</p>
        </div>
        <Link
          href="/assess"
          className="flex-shrink-0 text-sm text-blue-400 border border-blue-500/30 hover:bg-blue-500/10 px-4 py-2 rounded-lg transition"
        >
          Re-assess
        </Link>
      </div>

      {/* Risk banner */}
      <div className={`border rounded-2xl p-6 mb-6 ${config.bg}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className={`text-xs font-semibold mb-1 ${config.color}`}>RISK LEVEL</div>
            <div className={`text-3xl font-bold ${config.color}`}>{config.label}</div>
            <p className="text-gray-300 text-sm mt-2">{assessment.risk_rationale}</p>
            <p className="text-xs font-mono text-blue-400 mt-2">{assessment.regulatory_basis}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-xs text-gray-400 mb-1">Compliance Score</div>
            <div className={`text-4xl font-bold ${config.color}`}>{assessment.compliance_score}%</div>
          </div>
        </div>
      </div>

      {/* Prohibition reason */}
      {assessment.prohibited_reason && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-red-400 mb-2">Prohibition Basis</h2>
          <p className="text-gray-300 text-sm">{assessment.prohibited_reason}</p>
        </div>
      )}

      {/* Immediate actions */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
        <h2 className="font-semibold mb-4">Immediate Actions Required</h2>
        <ol className="space-y-3">
          {immediateActions.map((action, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span className="text-gray-300 text-sm">{action}</span>
            </li>
          ))}
        </ol>
        <div className="mt-4 pt-4 border-t border-white/10 text-sm">
          <span className="text-gray-400">Estimated effort: </span>
          <span className="text-white font-medium">{assessment.estimated_effort}</span>
        </div>
      </div>

      {/* Full requirements */}
      {requirements.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="font-semibold mb-5">Compliance Requirements ({requirements.length})</h2>
          <div className="space-y-3">
            {requirements.map(req => (
              <div key={req.id} className="border border-white/10 rounded-lg p-4">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div>
                    <span className="text-xs font-mono text-blue-400 mr-2">{req.article}</span>
                    <span className="text-sm font-semibold">{req.title}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${
                    req.effort === 'HIGH' ? 'bg-red-500/20 text-red-400' :
                    req.effort === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {req.effort}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">{req.description}</p>
                <p className="text-xs text-gray-500 mt-1">Deadline: {req.deadline}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
