import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getPlanFeatures } from '@/lib/stripe'
import type { RiskLevel, ComplianceRequirement } from '@/lib/eu-ai-act'
import { PrintTrigger } from './print-trigger'

const RISK_LABELS: Record<RiskLevel, string> = {
  PROHIBITED:   'PROHIBITED',
  HIGH_RISK:    'HIGH RISK',
  LIMITED_RISK: 'LIMITED RISK',
  MINIMAL_RISK: 'MINIMAL RISK',
}

export default async function PrintPage({ params }: { params: Promise<{ id: string }> }) {
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

  const admin = getSupabaseAdmin()
  const { data: docRow } = await admin
    .from('technical_docs')
    .select('content')
    .eq('assessment_id', id)
    .eq('user_id', user.id)
    .single()

  // Fetch checklist progress
  const { data: progressRows } = await supabase
    .from('requirement_progress')
    .select('requirement_id, status, notes')
    .eq('user_id', user.id)
    .eq('assessment_id', id)

  const progressMap: Record<string, { status: string; notes: string }> = {}
  for (const row of progressRows ?? []) {
    progressMap[row.requirement_id] = { status: row.status, notes: row.notes ?? '' }
  }

  const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
  const planFeatures = getPlanFeatures(profile?.plan)

  const doc = docRow?.content as { sections?: { title: string; article_ref: string; content: string }[] } | null
  const requirements = (assessment.requirements ?? []) as ComplianceRequirement[]
  const immediateActions = (assessment.immediate_actions ?? []) as string[]
  const riskLabel = RISK_LABELS[assessment.risk_level as RiskLevel] ?? assessment.risk_level

  return (
    <>
      <PrintTrigger />
      <style>{`
        @page { margin: 20mm 18mm; }
        p, li { orphans: 3; widows: 3; }
      `}</style>
      <div className="max-w-3xl mx-auto px-10 py-12 bg-white text-gray-900 min-h-screen print:p-0">

        {/* Header — keep together, never break inside */}
        <div className="border-b-2 border-gray-900 pb-6 mb-8 break-inside-avoid">
          <div className="flex items-start justify-between">
            <div>
              {!planFeatures.whiteLabel && <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">ActComply · EU AI Act Compliance Report</div>}
              <h1 className="text-2xl font-bold text-gray-900">{assessment.name}</h1>
              <p className="text-gray-500 text-sm mt-1">{assessment.sector}</p>
            </div>
            <div className="text-right">
              <div className={`text-lg font-bold ${
                assessment.risk_level === 'PROHIBITED' ? 'text-red-600' :
                assessment.risk_level === 'HIGH_RISK' ? 'text-orange-600' :
                assessment.risk_level === 'LIMITED_RISK' ? 'text-yellow-600' :
                'text-green-600'
              }`}>{riskLabel}</div>
              <div className="text-2xl font-bold text-gray-900">{assessment.compliance_score}%</div>
              <div className="text-xs text-gray-400">compliance score</div>
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-400">
            Generated {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            {' · '}Regulatory basis: {assessment.regulatory_basis}
          </div>
        </div>

        {/* Risk rationale */}
        <section className="mb-8 break-inside-avoid">
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-3 break-after-avoid">Risk Classification Rationale</h2>
          <p className="text-gray-700 leading-relaxed">{assessment.risk_rationale}</p>
          {assessment.prohibited_reason && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800 break-inside-avoid">
              <strong>Prohibition basis:</strong> {assessment.prohibited_reason}
            </div>
          )}
        </section>

        {/* Immediate actions */}
        <section className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-3 break-after-avoid">Immediate Actions Required</h2>
          <ol className="space-y-2">
            {immediateActions.map((action, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-700 break-inside-avoid">
                <span className="w-5 h-5 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
                {action}
              </li>
            ))}
          </ol>
          <p className="text-xs text-gray-400 mt-3">Estimated effort: {assessment.estimated_effort}</p>
        </section>

        {/* Compliance requirements */}
        {requirements.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-3 break-after-avoid">
              Compliance Requirements ({requirements.length})
            </h2>
            <div className="space-y-3">
              {requirements.map(req => {
                const p = progressMap[req.id]
                const status = p?.status ?? 'not_started'
                return (
                  <div key={req.id} className={`border rounded p-3 break-inside-avoid ${status === 'done' ? 'border-green-300 bg-green-50' : status === 'in_progress' ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'}`}>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${status === 'done' ? 'text-green-600' : status === 'in_progress' ? 'text-yellow-600' : 'text-gray-400'}`}>
                          {status === 'done' ? '✓' : status === 'in_progress' ? '◑' : '○'}
                        </span>
                        <span className="text-xs font-mono text-blue-600">{req.article}</span>
                        <span className={`text-sm font-semibold ${status === 'done' ? 'line-through text-gray-400' : ''}`}>{req.title}</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded font-medium shrink-0 ${
                        req.effort === 'HIGH' ? 'bg-red-100 text-red-700' :
                        req.effort === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>{req.effort}</span>
                    </div>
                    <p className="text-xs text-gray-500">{req.description}</p>
                    <p className="text-xs text-gray-400 mt-1">Deadline: {req.deadline}</p>
                    {p?.notes && <p className="text-xs text-gray-600 mt-1 italic">Notes: {p.notes}</p>}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Technical documentation sections */}
        {doc?.sections && doc.sections.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-3 break-after-avoid">
              Article 11 Technical Documentation
            </h2>
            <div className="space-y-5">
              {doc.sections.map((s, i) => (
                <div key={i} className="break-inside-avoid">
                  <div className="flex items-baseline gap-2 mb-1">
                    <h3 className="text-sm font-bold break-after-avoid">{s.title}</h3>
                    <span className="text-xs font-mono text-blue-500">{s.article_ref}</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{s.content}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <div className="border-t border-gray-200 pt-6 text-xs text-gray-400 text-center break-inside-avoid">
          {planFeatures.whiteLabel
            ? 'This document is for compliance guidance only and does not constitute legal advice.'
            : 'Generated by ActComply · getactcomply.com · This document is for compliance guidance only and does not constitute legal advice.'
          }
        </div>
      </div>
    </>
  )
}
