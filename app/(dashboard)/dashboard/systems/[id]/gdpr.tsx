'use client'

import { useState, useEffect } from 'react'

type RiskLevel = 'low' | 'medium' | 'high' | 'none'

interface ProcessingActivity {
  id: string
  name: string
  legal_basis: string
  special_category: boolean
  special_category_condition?: string
  necessity_assessment: string
  proportionality: string
}

interface Risk {
  id: string
  risk: string
  likelihood: RiskLevel
  severity: RiskLevel
  mitigation: string
  residual_risk: RiskLevel
}

interface FundamentalRight {
  right: string
  affected_groups: string[]
  impact_level: RiskLevel
  mitigation: string
}

interface GdprAssessment {
  generated_at: string
  dpia_required: boolean
  dpia_rationale: string
  fria_required: boolean
  fria_rationale: string
  processing_activities: ProcessingActivity[]
  risks: Risk[]
  fundamental_rights_impacts: FundamentalRight[]
  explainability_statement: string
  safeguards: string[]
  consultation_required: boolean
  consultation_rationale: string
}

interface Props {
  assessmentId: string
  isPaid: boolean
}

const LEVEL_STYLES: Record<string, string> = {
  none:   'bg-green-500/15 text-green-400 border-green-500/30',
  low:    'bg-green-500/15 text-green-400 border-green-500/30',
  medium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  high:   'bg-red-500/15 text-red-400 border-red-500/30',
}

function LevelBadge({ level }: { level: string }) {
  const normalized = level.toLowerCase()
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded border capitalize ${LEVEL_STYLES[normalized] ?? LEVEL_STYLES.low}`}>
      {normalized}
    </span>
  )
}

export function GdprAssessment({ assessmentId, isPaid }: Props) {
  const [assessment, setAssessment] = useState<GdprAssessment | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'dpia' | 'fria' | 'explainability'>('dpia')
  const [expandedRisk, setExpandedRisk] = useState<string | null>(null)
  const [expandedRight, setExpandedRight] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/gdpr/${assessmentId}`)
      .then(r => r.json())
      .then(d => { setAssessment(d?.content ?? null); setLoading(false) })
      .catch(() => setLoading(false))
  }, [assessmentId])

  async function generate() {
    setGenerating(true)
    setGenError(null)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 120_000)
    try {
      const res = await fetch(`/api/gdpr/${assessmentId}`, { method: 'POST', signal: controller.signal })
      const data = await res.json()
      if (!res.ok || data.error) {
        setGenError(data.message ?? data.error ?? 'Generation failed — please try again.')
      } else {
        setAssessment(data)
        setActiveTab('dpia')
        setExpandedRisk(null)
        setExpandedRight(null)
      }
    } catch (e) {
      setGenError(e instanceof Error && e.name === 'AbortError'
        ? 'Timed out — please try again.'
        : 'Something went wrong — please try again.')
    } finally {
      clearTimeout(timeout)
      setGenerating(false)
    }
  }

  if (!isPaid) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold mb-1">GDPR DPIA + Fundamental Rights Impact Assessment</h2>
            <p className="text-sm text-gray-400">
              Integrated GDPR Article 35 DPIA, EU AI Act Article 27 FRIA, and Article 86 explainability statement — in a single document.
            </p>
          </div>
          <a
            href="/#pricing"
            className="shrink-0 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
          >
            Upgrade to generate →
          </a>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h2 className="font-semibold mb-2">GDPR DPIA + Fundamental Rights Impact Assessment</h2>
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!assessment) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-semibold mb-1">GDPR DPIA + Fundamental Rights Impact Assessment</h2>
            <p className="text-sm text-gray-400 max-w-lg">
              Generate an integrated GDPR Article 35 DPIA and EU AI Act Article 27 FRIA — including a risk register, fundamental rights analysis, and an Article 86 explainability statement for affected persons.
            </p>
          </div>
          <button
            onClick={generate}
            disabled={generating}
            className="shrink-0 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition flex items-center gap-2"
          >
            {generating ? (
              <>
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating...
              </>
            ) : 'Generate DPIA + FRIA →'}
          </button>
        </div>
        {genError && (
          <div className="mt-4 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
            {genError}
          </div>
        )}
      </div>
    )
  }

  const hasSpecialCategory = assessment.processing_activities.some(a => a.special_category)
  const highRisks = assessment.risks.filter(r => r.severity.toLowerCase() === 'high' || r.likelihood.toLowerCase() === 'high').length
  const highRights = assessment.fundamental_rights_impacts.filter(r => r.impact_level.toLowerCase() === 'high').length

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-semibold">GDPR DPIA + Fundamental Rights Impact Assessment</h2>
            {assessment.dpia_required && (
              <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full">DPIA required</span>
            )}
            {assessment.fria_required && (
              <span className="text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-full">FRIA required</span>
            )}
            {hasSpecialCategory && (
              <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full">Special-category data</span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Generated {new Date(assessment.generated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            {' · '}{assessment.risks.length} risks · {assessment.fundamental_rights_impacts.length} rights assessed
            {highRisks > 0 && <span className="text-red-400"> · {highRisks} high-risk</span>}
          </p>
        </div>
        <button
          onClick={generate}
          disabled={generating}
          className="text-xs text-gray-400 hover:text-white border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
        >
          {generating ? 'Regenerating...' : 'Regenerate'}
        </button>
      </div>

      {/* Consultation warning */}
      {assessment.consultation_required && (
        <div className="px-6 py-3 bg-yellow-500/5 border-b border-yellow-500/10 text-xs text-yellow-300/80">
          <span className="font-semibold text-yellow-400">DPO consultation required: </span>
          {assessment.consultation_rationale}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        {([
          { key: 'dpia', label: `DPIA${highRisks > 0 ? ` (${highRisks} high)` : ''}` },
          { key: 'fria', label: `FRIA${highRights > 0 ? ` (${highRights} high)` : ''}` },
          { key: 'explainability', label: 'Article 86' },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-5 py-3 text-xs font-medium transition ${
              activeTab === key
                ? 'text-white border-b-2 border-blue-500 -mb-px'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* DPIA tab */}
      {activeTab === 'dpia' && (
        <div>
          {/* Rationale */}
          <div className="px-6 py-4 border-b border-white/5">
            <p className="text-xs text-gray-400 mb-1">DPIA determination</p>
            <p className="text-sm text-gray-300">{assessment.dpia_rationale}</p>
          </div>

          {/* Processing activities */}
          <div className="border-b border-white/10">
            <div className="px-6 py-3">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Processing Activities</p>
            </div>
            <div className="divide-y divide-white/5">
              {assessment.processing_activities.map(activity => (
                <div key={activity.id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span className="text-sm font-medium">{activity.name}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      {activity.special_category && (
                        <span className="text-xs bg-red-500/15 text-red-400 border border-red-500/30 px-2 py-0.5 rounded">Art. 9/10</span>
                      )}
                      <span className="text-xs font-mono text-blue-400">{activity.legal_basis}</span>
                    </div>
                  </div>
                  {activity.special_category && activity.special_category_condition && (
                    <p className="text-xs text-red-300/70 mb-2">Condition: {activity.special_category_condition}</p>
                  )}
                  <p className="text-xs text-gray-400 mb-1">Necessity: <span className="text-gray-300">{activity.necessity_assessment}</span></p>
                  <p className="text-xs text-gray-400">Proportionality: <span className="text-gray-300">{activity.proportionality}</span></p>
                </div>
              ))}
            </div>
          </div>

          {/* Risk register */}
          <div>
            <div className="px-6 py-3 border-b border-white/5">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Risk Register</p>
            </div>
            <div className="divide-y divide-white/5">
              {assessment.risks.map(risk => (
                <div key={risk.id}>
                  <button
                    onClick={() => setExpandedRisk(expandedRisk === risk.id ? null : risk.id)}
                    className="w-full flex items-center justify-between px-6 py-3 hover:bg-white/5 transition text-left"
                  >
                    <span className="text-sm text-gray-200 flex-1 pr-4">{risk.risk}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-gray-500">L:</span><LevelBadge level={risk.likelihood} />
                      <span className="text-xs text-gray-500">S:</span><LevelBadge level={risk.severity} />
                      <svg className={`w-4 h-4 text-gray-500 transition-transform ${expandedRisk === risk.id ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>
                  {expandedRisk === risk.id && (
                    <div className="px-6 pb-4 space-y-2">
                      <p className="text-xs text-gray-400">Mitigation: <span className="text-gray-300">{risk.mitigation}</span></p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">Residual risk:</span>
                        <LevelBadge level={risk.residual_risk} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Safeguards */}
          {assessment.safeguards.length > 0 && (
            <div className="px-6 py-4 border-t border-white/10">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Safeguards</p>
              <ul className="space-y-1.5">
                {assessment.safeguards.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* FRIA tab */}
      {activeTab === 'fria' && (
        <div>
          <div className="px-6 py-4 border-b border-white/5">
            <p className="text-xs text-gray-400 mb-1">FRIA determination</p>
            <p className="text-sm text-gray-300">{assessment.fria_rationale}</p>
          </div>
          <div className="divide-y divide-white/5">
            {assessment.fundamental_rights_impacts.map((item, i) => (
              <div key={i}>
                <button
                  onClick={() => setExpandedRight(expandedRight === item.right ? null : item.right)}
                  className="w-full flex items-center justify-between px-6 py-3 hover:bg-white/5 transition text-left"
                >
                  <span className="text-sm text-gray-200 flex-1 pr-4">{item.right}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <LevelBadge level={item.impact_level} />
                    <svg className={`w-4 h-4 text-gray-500 transition-transform ${expandedRight === item.right ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                {expandedRight === item.right && (
                  <div className="px-6 pb-4 space-y-2">
                    {item.affected_groups.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Affected groups</p>
                        <div className="flex flex-wrap gap-1.5">
                          {item.affected_groups.map((g, j) => (
                            <span key={j} className="text-xs bg-white/5 border border-white/10 text-gray-300 px-2 py-0.5 rounded">{g}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-gray-400">Mitigation: <span className="text-gray-300">{item.mitigation}</span></p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Explainability tab (Article 86) */}
      {activeTab === 'explainability' && (
        <div className="px-6 py-5 space-y-5">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Article 86 — Right to Explanation</p>
            <p className="text-sm text-gray-300 leading-relaxed">{assessment.explainability_statement}</p>
          </div>
          {hasSpecialCategory && (
            <div className="border border-red-500/20 bg-red-500/5 rounded-lg p-4">
              <p className="text-xs font-semibold text-red-400 mb-2">Article 9/10 — Special-Category Data</p>
              {assessment.processing_activities
                .filter(a => a.special_category)
                .map(a => (
                  <div key={a.id} className="mb-2 last:mb-0">
                    <p className="text-xs text-red-300/80 font-medium">{a.name}</p>
                    {a.special_category_condition && (
                      <p className="text-xs text-gray-400 mt-0.5">Condition: {a.special_category_condition}</p>
                    )}
                  </div>
                ))
              }
            </div>
          )}
        </div>
      )}
    </div>
  )
}
