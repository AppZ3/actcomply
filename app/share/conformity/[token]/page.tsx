import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import type { RiskLevel, ComplianceRequirement } from '@/lib/eu-ai-act'
import { PrintButton } from './print-button'

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params
  const admin = getSupabaseAdmin()
  const { data: tokenRow } = await admin
    .from('conformity_share_tokens')
    .select('assessment_id')
    .eq('token', token)
    .maybeSingle()
  const baseMetadata: Metadata = {
    robots: { index: false, follow: false },
  }
  if (!tokenRow) return { ...baseMetadata, title: 'Conformity Pack' }
  const { data: a } = await admin.from('assessments').select('name').eq('id', tokenRow.assessment_id).maybeSingle()
  return {
    ...baseMetadata,
    title: a?.name ? `${a.name}, Conformity Pack` : 'Conformity Pack',
  }
}

const RISK_LABELS: Record<RiskLevel, string> = {
  PROHIBITED:   'PROHIBITED',
  HIGH_RISK:    'HIGH RISK',
  LIMITED_RISK: 'LIMITED RISK',
  MINIMAL_RISK: 'MINIMAL RISK',
}

const RISK_COLORS: Record<RiskLevel, string> = {
  PROHIBITED:   'text-red-700',
  HIGH_RISK:    'text-orange-700',
  LIMITED_RISK: 'text-yellow-700',
  MINIMAL_RISK: 'text-green-700',
}

function docRef(assessmentId: string) {
  return `AC-${new Date().getFullYear()}-${assessmentId.slice(0, 8).toUpperCase()}`
}

function statusLabel(status: string) {
  if (status === 'done') return 'Completed'
  if (status === 'in_progress') return 'In Progress'
  return 'Not Started'
}

function statusColor(status: string) {
  if (status === 'done') return 'text-green-700 bg-green-50 border-green-200'
  if (status === 'in_progress') return 'text-yellow-700 bg-yellow-50 border-yellow-200'
  return 'text-gray-500 bg-gray-50 border-gray-200'
}

export default async function PublicConformityPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const admin = getSupabaseAdmin()

  const { data: tokenRow } = await admin
    .from('conformity_share_tokens')
    .select('assessment_id, expires_at, user_id')
    .eq('token', token)
    .single()

  if (!tokenRow) notFound()

  if (tokenRow.expires_at && new Date(tokenRow.expires_at) < new Date()) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md px-8">
          <div className="text-4xl mb-4">⏰</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Link expired</h1>
          <p className="text-gray-500 text-sm">This conformity pack link has expired. Contact the system owner for an updated link.</p>
        </div>
      </div>
    )
  }

  const id = tokenRow.assessment_id
  const userId = tokenRow.user_id

  const [
    { data: assessment },
    { data: docRow },
    { data: progressRows },
    { data: loggingRow },
    { data: gdprRow },
    { data: riskRow },
  ] = await Promise.all([
    admin.from('assessments').select('*').eq('id', id).eq('user_id', userId).single(),
    admin.from('technical_docs').select('sections').eq('assessment_id', id).eq('user_id', userId).single(),
    admin.from('requirement_progress').select('requirement_id, status, notes').eq('user_id', userId).eq('assessment_id', id),
    admin.from('logging_specs').select('content').eq('assessment_id', id).eq('user_id', userId).single(),
    admin.from('gdpr_assessments').select('content').eq('assessment_id', id).eq('user_id', userId).single(),
    admin.from('risk_management_plans').select('content').eq('assessment_id', id).eq('user_id', userId).single(),
  ])

  if (!assessment) notFound()

  const progressMap: Record<string, { status: string; notes: string }> = {}
  for (const row of progressRows ?? []) {
    progressMap[row.requirement_id] = { status: row.status, notes: row.notes ?? '' }
  }

  const doc = docRow?.sections as {
    version?: number
    generated_at?: string
    sections?: { id: string; title: string; article_ref: string; content: string }[]
  } | null

  const gdprSpec = gdprRow?.content as {
    generated_at?: string
    dpia_required?: boolean
    fria_required?: boolean
    dpia_rationale?: string
    fria_rationale?: string
    processing_activities?: { id: string; name: string; legal_basis: string; special_category: boolean; necessity_assessment: string; proportionality: string }[]
    risks?: { id: string; risk: string; likelihood: string; severity: string; mitigation: string; residual_risk: string }[]
    fundamental_rights_impacts?: { right: string; affected_groups: string[]; impact_level: string; mitigation: string }[]
    explainability_statement?: string
    safeguards?: string[]
    consultation_required?: boolean
    consultation_rationale?: string
  } | null

  const riskPlan = riskRow?.content as {
    generated_at?: string
    overall_risk_level?: string
    overall_rationale?: string
    review_interval_months?: number
    residual_risk_communication?: string
    risk_items?: { id: string; category: string; risk: string; article_ref: string; probability: string; severity: string; measures: string[]; residual_risk: string; monitoring_indicator: string }[]
    change_triggers?: { trigger: string; article_ref: string; urgency: string; required_action: string }[]
    testing_requirements?: { test: string; frequency: string; article_ref: string; method: string }[]
  } | null

  const loggingSpec = loggingRow?.content as {
    generated_at?: string
    retention_period_months?: number
    retention_rationale?: string
    events?: { id: string; name: string; article_ref: string; description: string; fields_to_log: string[]; trigger: string }[]
    policy?: { storage_format: string; immutability: string; access_controls: string; integrity: string; review_frequency: string }
    retention_schedule?: { record_type: string; retention_period: string; article: string; disposal_method: string }[]
  } | null

  const requirements = (assessment.requirements ?? []) as ComplianceRequirement[]
  const immediateActions = (assessment.immediate_actions ?? []) as string[]
  const riskLabel = RISK_LABELS[assessment.risk_level as RiskLevel] ?? assessment.risk_level
  const riskColor = RISK_COLORS[assessment.risk_level as RiskLevel] ?? 'text-gray-700'
  const ref = docRef(id)
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const completedCount = requirements.filter(r => progressMap[r.id]?.status === 'done').length

  return (
    <>
      <style>{`
        @page { margin: 20mm 18mm; size: A4; }
        @media print { .no-print { display: none !important; } .page-break { break-before: page; } }
        p, li { orphans: 3; widows: 3; }
      `}</style>

      <div className="no-print bg-blue-50 border-b border-blue-200 px-6 py-2.5 flex items-center justify-between gap-4 print:hidden">
        <p className="text-xs text-blue-700">
          <span className="font-semibold">Shared conformity pack</span>: {assessment.name} · Read-only view
        </p>
        <PrintButton />
      </div>

      <div className="max-w-3xl mx-auto px-10 py-12 bg-white text-gray-900 min-h-screen print:p-0 text-sm">

        {/* Cover */}
        <div className="border-b-2 border-gray-900 pb-8 mb-10 break-inside-avoid">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">
            ActComply · getactcomply.com
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            EU AI Act, Conformity Assessment Evidence Pack
          </h1>
          <p className="text-gray-500 text-sm mb-6">
            Prepared in accordance with Regulation (EU) 2024/1689, EU AI Act
          </p>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <div><span className="text-gray-400 text-xs uppercase tracking-wide block mb-0.5">AI System</span><span className="font-semibold">{assessment.name}</span></div>
            <div><span className="text-gray-400 text-xs uppercase tracking-wide block mb-0.5">Document Reference</span><span className="font-mono font-semibold">{ref}</span></div>
            <div><span className="text-gray-400 text-xs uppercase tracking-wide block mb-0.5">Sector</span><span>{assessment.sector}</span></div>
            <div><span className="text-gray-400 text-xs uppercase tracking-wide block mb-0.5">Date of Preparation</span><span>{today}</span></div>
            <div><span className="text-gray-400 text-xs uppercase tracking-wide block mb-0.5">Risk Classification</span><span className={`font-bold ${riskColor}`}>{riskLabel}</span></div>
            <div><span className="text-gray-400 text-xs uppercase tracking-wide block mb-0.5">Compliance Score</span><span className="font-bold">{assessment.compliance_score}%</span></div>
            {doc?.version != null && (
              <div><span className="text-gray-400 text-xs uppercase tracking-wide block mb-0.5">Technical Doc Version</span><span className="font-mono">v{doc.version}</span></div>
            )}
          </div>
        </div>

        {/* 1. Declaration */}
        <section className="mb-10 break-inside-avoid">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">1. Declaration of Conformity</h2>
          <div className="border border-gray-300 rounded p-5 bg-gray-50">
            <p className="text-gray-800 leading-relaxed mb-3">The operator declares that the AI system identified in this document has been assessed against the requirements of Regulation (EU) 2024/1689 (EU AI Act) and that, to the best of their knowledge, the system meets the applicable obligations for its risk classification.</p>
            <p className="text-gray-800 leading-relaxed mb-3">This evidence pack has been prepared in accordance with Article 11 (technical documentation), Article 9 (risk management), Article 12 (logging), and Article 13 (transparency) of the EU AI Act, and is made available to competent authorities upon request as required by Article 23.</p>
            <p className="text-gray-600 text-xs mt-4">Regulatory basis: {assessment.regulatory_basis}</p>
          </div>
        </section>

        {/* 2. System ID */}
        <section className="mb-10 break-inside-avoid">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">2. System Identification</h2>
          <table className="w-full text-sm border-collapse">
            <tbody>
              {([
                ['System Name', assessment.name],
                ['Description', assessment.description],
                ['Intended Purpose', assessment.purpose],
                ['Sector', assessment.sector],
                ['Uses Personal Data', assessment.uses_personal_data ? 'Yes' : 'No'],
                ['Makes Autonomous Decisions', assessment.makes_autonomous_decisions ? 'Yes' : 'No'],
                ['Affects Individuals', assessment.affects_individuals ? 'Yes' : 'No'],
                ['Current Safeguards', assessment.current_safeguards || 'None described'],
                ['First Assessed', new Date(assessment.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })],
              ] as [string, string][]).map(([label, value]) => (
                <tr key={label} className="border-b border-gray-100">
                  <td className="py-2 pr-4 text-gray-400 font-medium w-44 align-top">{label}</td>
                  <td className="py-2 text-gray-800 align-top">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* 3. Risk */}
        <section className="mb-10 break-inside-avoid">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">3. Risk Classification</h2>
          <div className="mb-3">
            <span className={`text-lg font-bold ${riskColor}`}>{riskLabel}</span>
            <span className="text-gray-400 text-xs ml-3">Compliance score: {assessment.compliance_score}%</span>
          </div>
          <p className="text-gray-700 leading-relaxed mb-3">{assessment.risk_rationale}</p>
          {assessment.prohibited_reason && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800 break-inside-avoid">
              <strong>Prohibition basis:</strong> {assessment.prohibited_reason}
            </div>
          )}
          <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded text-xs text-blue-700">
            <strong>Regulatory basis:</strong> {assessment.regulatory_basis}
          </div>
        </section>

        {/* 4. Technical Docs */}
        {doc?.sections && doc.sections.length > 0 ? (
          <section className="mb-10 page-break">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">4. Article 11 Technical Documentation (Annex IV)</h2>
            {doc.version != null && doc.generated_at && (
              <p className="text-xs text-gray-400 mb-4">Version {doc.version} · Generated {new Date(doc.generated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            )}
            <div className="space-y-6">
              {doc.sections.map((s, i) => (
                <div key={s.id} className="break-inside-avoid">
                  <div className="flex items-baseline gap-2 mb-1.5">
                    <span className="text-xs font-bold text-gray-400">4.{i + 1}</span>
                    <h3 className="font-semibold text-gray-900">{s.title}</h3>
                    <span className="text-xs font-mono text-blue-600">{s.article_ref}</span>
                  </div>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-xs">{s.content}</p>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section className="mb-10 break-inside-avoid">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">4. Article 11 Technical Documentation (Annex IV)</h2>
            <div className="border border-dashed border-gray-300 rounded p-4 text-gray-400 text-xs">Technical documentation has not yet been generated for this system.</div>
          </section>
        )}

        {/* 5. Logging */}
        {loggingSpec ? (
          <section className="mb-10 page-break">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">5. Article 12 Logging & Article 19 Retention</h2>
            {loggingSpec.generated_at && (
              <p className="text-xs text-gray-400 mb-4">
                Generated {new Date(loggingSpec.generated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                {loggingSpec.retention_period_months != null && <> · Retention: <strong>{loggingSpec.retention_period_months >= 36 ? `${loggingSpec.retention_period_months / 12} years` : `${loggingSpec.retention_period_months} months`}</strong></>}
              </p>
            )}
            {loggingSpec.events && loggingSpec.events.length > 0 && (
              <div className="mb-5">
                <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Logging Events</h3>
                <div className="space-y-3">
                  {loggingSpec.events.map(event => (
                    <div key={event.id} className="border border-gray-200 rounded p-3 break-inside-avoid">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-gray-900">{event.name}</span>
                        <span className="text-xs font-mono text-blue-600">{event.article_ref}</span>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">{event.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {event.fields_to_log.map((f, j) => (
                          <span key={j} className="text-xs font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{f}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        ) : (
          <section className="mb-10 break-inside-avoid">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">5. Article 12 Logging & Article 19 Retention</h2>
            <div className="border border-dashed border-gray-300 rounded p-4 text-gray-400 text-xs">Logging specification not yet generated.</div>
          </section>
        )}

        {/* 6. GDPR */}
        {gdprSpec ? (
          <section className="mb-10 page-break">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">6. GDPR DPIA & Fundamental Rights Impact Assessment</h2>
            {gdprSpec.risks && gdprSpec.risks.length > 0 && (
              <div className="mb-5">
                <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Risk Register</h3>
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-1.5 pr-3 text-gray-400 font-medium">Risk</th>
                      <th className="text-left py-1.5 pr-2 text-gray-400 font-medium w-16">Likelihood</th>
                      <th className="text-left py-1.5 pr-2 text-gray-400 font-medium w-16">Severity</th>
                      <th className="text-left py-1.5 pr-2 text-gray-400 font-medium w-20">Residual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gdprSpec.risks.map((risk, i) => (
                      <tr key={i} className="border-b border-gray-100 break-inside-avoid">
                        <td className="py-1.5 pr-3 text-gray-700 align-top">{risk.risk}</td>
                        <td className="py-1.5 pr-2 align-top capitalize text-gray-600">{risk.likelihood}</td>
                        <td className="py-1.5 pr-2 align-top capitalize text-gray-600">{risk.severity}</td>
                        <td className="py-1.5 align-top capitalize font-semibold text-gray-700">{risk.residual_risk}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {gdprSpec.explainability_statement && (
              <div>
                <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Article 86, Explainability Statement</h3>
                <p className="text-xs text-gray-600 leading-relaxed">{gdprSpec.explainability_statement}</p>
              </div>
            )}
          </section>
        ) : (
          <section className="mb-10 break-inside-avoid">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">6. GDPR DPIA & Fundamental Rights Impact Assessment</h2>
            <div className="border border-dashed border-gray-300 rounded p-4 text-gray-400 text-xs">DPIA + FRIA not yet generated.</div>
          </section>
        )}

        {/* 7. Risk Management */}
        {riskPlan ? (
          <section className="mb-10 page-break">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">7. Article 9, Risk Management Plan</h2>
            {riskPlan.overall_rationale && <p className="text-xs text-gray-700 leading-relaxed mb-4">{riskPlan.overall_rationale}</p>}
            {riskPlan.risk_items && riskPlan.risk_items.length > 0 && (
              <div className="mb-5">
                <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Risk Register</h3>
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-1.5 pr-3 text-gray-400 font-medium">Risk</th>
                      <th className="text-left py-1.5 pr-2 text-gray-400 font-medium w-20">Category</th>
                      <th className="text-left py-1.5 pr-2 text-gray-400 font-medium w-16">Prob.</th>
                      <th className="text-left py-1.5 pr-2 text-gray-400 font-medium w-16">Severity</th>
                      <th className="text-left py-1.5 text-gray-400 font-medium w-16">Residual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riskPlan.risk_items.map((item, i) => (
                      <tr key={i} className="border-b border-gray-100 break-inside-avoid">
                        <td className="py-1.5 pr-3 text-gray-700 align-top">{item.risk}</td>
                        <td className="py-1.5 pr-2 text-gray-500 align-top text-xs">{item.category}</td>
                        <td className="py-1.5 pr-2 align-top capitalize text-gray-600">{item.probability}</td>
                        <td className="py-1.5 pr-2 align-top capitalize font-semibold text-gray-700">{item.severity}</td>
                        <td className="py-1.5 align-top capitalize text-gray-600">{item.residual_risk}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ) : (
          <section className="mb-10 break-inside-avoid">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">7. Article 9, Risk Management Plan</h2>
            <div className="border border-dashed border-gray-300 rounded p-4 text-gray-400 text-xs">Risk management plan not yet generated.</div>
          </section>
        )}

        {/* 8. Compliance Requirements */}
        {requirements.length > 0 && (
          <section className="mb-10 page-break">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">8. Compliance Requirements</h2>
            <p className="text-xs text-gray-400 mb-4">{completedCount} of {requirements.length} requirements completed</p>
            <div className="space-y-2">
              {requirements.map(req => {
                const p = progressMap[req.id]
                const status = p?.status ?? 'not_started'
                return (
                  <div key={req.id} className="border border-gray-200 rounded p-3 break-inside-avoid">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="text-xs font-mono text-blue-600">{req.article}</span>
                          <span className="font-semibold text-gray-900 text-xs">{req.title}</span>
                        </div>
                        <p className="text-xs text-gray-500">{req.description}</p>
                        {p?.notes && <p className="text-xs text-gray-600 mt-1 italic">Notes: {p.notes}</p>}
                        <p className="text-xs text-gray-400 mt-1">Deadline: {req.deadline}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded border font-medium shrink-0 ${statusColor(status)}`}>
                        {statusLabel(status)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* 9. Immediate Actions */}
        {immediateActions.length > 0 && (
          <section className="mb-10 break-inside-avoid">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">9. Immediate Remediation Actions</h2>
            <ol className="space-y-2">
              {immediateActions.map((action, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-700 break-inside-avoid">
                  <span className="w-5 h-5 bg-gray-800 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
                  <span className="text-xs leading-relaxed">{action}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Signature block */}
        <section className="mt-12 pt-8 border-t-2 border-gray-900 break-inside-avoid">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6">Authorised Signatory</h2>
          <div className="grid grid-cols-2 gap-8">
            <div><div className="border-b border-gray-400 mb-1.5 h-8" /><p className="text-xs text-gray-400">Name (print)</p></div>
            <div><div className="border-b border-gray-400 mb-1.5 h-8" /><p className="text-xs text-gray-400">Position / Title</p></div>
            <div><div className="border-b border-gray-400 mb-1.5 h-8" /><p className="text-xs text-gray-400">Signature</p></div>
            <div><div className="border-b border-gray-400 mb-1.5 h-8" /><p className="text-xs text-gray-400">Date</p></div>
          </div>
        </section>

        <div className="mt-10 pt-6 border-t border-gray-200 text-xs text-gray-400 flex justify-between break-inside-avoid">
          <span>Document ref: {ref}</span>
          <span>Generated by ActComply · getactcomply.com · Not legal advice.</span>
        </div>
      </div>
    </>
  )
}
