'use client'

import { useState, useEffect, useRef } from 'react'

const RISK_STEPS = [
  'Identifying foreseeable risks',
  'Assessing probability and severity',
  'Mapping risk mitigation measures',
  'Defining change triggers',
  'Writing testing requirements',
  'Computing review schedule',
]

function GeneratingProgress() {
  const [elapsed, setElapsed] = useState(0)
  const [activeStep, setActiveStep] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => setElapsed(s => s + 1), 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  const allDone = elapsed >= RISK_STEPS.length * 10

  useEffect(() => {
    setActiveStep(Math.min(Math.floor(elapsed / 10), RISK_STEPS.length - 1))
  }, [elapsed])

  return (
    <div className="mt-5 space-y-3">
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{allDone ? 'Finalising and saving…' : 'Claude is generating your risk management plan…'}</span>
        <span className="font-mono tabular-nums">{elapsed}s</span>
      </div>
      <div className="space-y-1.5">
        {RISK_STEPS.map((name, i) => {
          const done = allDone || i < activeStep
          const active = !allDone && i === activeStep
          return (
            <div key={i} className="flex items-center gap-2.5">
              <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${done ? 'bg-green-500' : active ? 'bg-blue-500' : 'bg-white/10'}`}>
                {done && <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                {active && <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
              </div>
              <span className={`text-xs transition-colors duration-300 ${done ? 'text-green-400' : active ? 'text-white' : 'text-gray-600'}`}>{name}</span>
            </div>
          )
        })}
      </div>
      {elapsed > 90 && !allDone && <p className="text-xs text-yellow-500/80 pt-1">Taking longer than usual — still working, don't close this tab.</p>}
      {allDone && (
        <p className="text-xs text-blue-400/80 pt-1 flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin inline-block" />
          All sections written — saving to your account…
        </p>
      )}
    </div>
  )
}

interface RiskItem {
  id: string
  category: string
  risk: string
  article_ref: string
  probability: string
  severity: string
  measures: string[]
  residual_risk: string
  monitoring_indicator: string
}

interface ChangeTrigger {
  trigger: string
  article_ref: string
  urgency: 'immediate' | 'within_30_days' | 'next_review'
  required_action: string
}

interface TestingRequirement {
  test: string
  frequency: string
  article_ref: string
  method: string
}

interface RiskManagementPlan {
  overall_risk_level: string
  overall_rationale: string
  risk_items: RiskItem[]
  change_triggers: ChangeTrigger[]
  testing_requirements: TestingRequirement[]
  residual_risk_communication: string
  review_interval_months: number
  generated_at: string
  model_changed_trigger?: boolean
}

const PROB_STYLES: Record<string, string> = {
  low:    'bg-green-500/10 text-green-400 border-green-500/20',
  medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  high:   'bg-orange-500/10 text-orange-400 border-orange-500/20',
}

const SEV_STYLES: Record<string, string> = {
  low:      'bg-green-500/10 text-green-400 border-green-500/20',
  medium:   'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  high:     'bg-orange-500/10 text-orange-400 border-orange-500/20',
  critical: 'bg-red-500/10 text-red-400 border-red-500/20',
}

const URGENCY_STYLES: Record<string, { label: string; style: string }> = {
  immediate:      { label: 'Immediate',      style: 'bg-red-500/10 text-red-400 border-red-500/20' },
  within_30_days: { label: 'Within 30 days', style: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  next_review:    { label: 'Next review',    style: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
}

const OVERALL_STYLES: Record<string, string> = {
  low:      'text-green-400 bg-green-500/10 border-green-500/20',
  medium:   'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  high:     'text-orange-400 bg-orange-500/10 border-orange-500/20',
  critical: 'text-red-400 bg-red-500/10 border-red-500/20',
}

function Badge({ value, styles }: { value: string; styles: Record<string, string> }) {
  const key = value.toLowerCase()
  const cls = styles[key] ?? styles.medium ?? 'bg-gray-500/10 text-gray-400 border-gray-500/20'
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cls}`}>
      {value.replaceAll('_', ' ').toUpperCase()}
    </span>
  )
}

export function RiskManagementPlan({ assessmentId, isPaid }: { assessmentId: string; isPaid: boolean }) {
  const [plan, setPlan] = useState<RiskManagementPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [tab, setTab] = useState<'risks' | 'triggers' | 'testing'>('risks')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [flagging, setFlagging] = useState(false)

  useEffect(() => {
    fetch(`/api/risk-management/${assessmentId}`)
      .then(r => r.json())
      .then(d => { if (d) setPlan(d.content ?? d) })
      .finally(() => setLoading(false))
  }, [assessmentId])

  async function generate(modelChanged = false) {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch(`/api/risk-management/${assessmentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_changed: modelChanged }),
        signal: AbortSignal.timeout(180_000),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.error === 'upgrade_required') setError('upgrade')
        else setError(data.error ?? 'Generation failed.')
        return
      }
      setPlan(data)
      setExpanded(null)
      setFlagging(false)
    } catch {
      setError('Request timed out. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) return null

  if (!isPaid) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h2 className="font-semibold mb-1">Article 9 — Risk Management Plan</h2>
        <p className="text-sm text-gray-400 mb-4">Generate a full lifecycle risk register, change triggers, and testing requirements.</p>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-sm text-blue-300">
          Upgrade to Business to generate Article 9 risk management plans.
        </div>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <div className="flex items-start justify-between gap-4 mb-1">
          <h2 className="font-semibold">Article 9 — Risk Management Plan</h2>
          <button
            onClick={() => generate(false)}
            disabled={generating}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition flex-shrink-0"
          >
            {generating ? 'Generating…' : 'Generate Risk Management Plan'}
          </button>
        </div>
        <p className="text-sm text-gray-400 mb-4">
          Generate a lifecycle risk register, change triggers, and testing requirements under EU AI Act Article 9.
        </p>
        {error && error !== 'upgrade' && (
          <p className="text-sm text-red-400 mb-3">{error}</p>
        )}
        {generating && <GeneratingProgress />}
      </div>
    )
  }

  const overallKey = plan.overall_risk_level?.toLowerCase()
  const overallStyle = OVERALL_STYLES[overallKey] ?? OVERALL_STYLES.medium
  const reviewDue = new Date(plan.generated_at)
  reviewDue.setMonth(reviewDue.getMonth() + (plan.review_interval_months ?? 12))
  const isOverdue = reviewDue < new Date()

  const highRisks = plan.risk_items?.filter(r => ['high', 'critical'].includes(r.severity?.toLowerCase())).length ?? 0
  const immediateTrigers = plan.change_triggers?.filter(t => t.urgency === 'immediate').length ?? 0

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h2 className="font-semibold mb-2">Article 9 — Risk Management Plan</h2>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${overallStyle}`}>
              {plan.overall_risk_level?.toUpperCase()} OVERALL RISK
            </span>
            {highRisks > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full border bg-orange-500/10 text-orange-400 border-orange-500/20">
                {highRisks} high/critical risk{highRisks !== 1 ? 's' : ''}
              </span>
            )}
            {immediateTrigers > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full border bg-red-500/10 text-red-400 border-red-500/20">
                {immediateTrigers} immediate trigger{immediateTrigers !== 1 ? 's' : ''}
              </span>
            )}
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${isOverdue ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>
              {isOverdue ? 'Review overdue' : `Review due ${reviewDue.toLocaleDateString()}`}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {!flagging ? (
            <button
              onClick={() => setFlagging(true)}
              className="text-xs text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/10 px-3 py-1.5 rounded-lg transition"
            >
              Flag model change
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-yellow-300">Re-generate with model change context?</span>
              <button
                onClick={() => generate(true)}
                disabled={generating}
                className="text-xs text-white bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 px-3 py-1.5 rounded-lg transition font-medium"
              >
                {generating ? 'Updating…' : 'Yes, update plan'}
              </button>
              <button onClick={() => setFlagging(false)} className="text-xs text-gray-400 hover:text-white px-2 py-1.5 transition">Cancel</button>
            </div>
          )}
          <button
            onClick={() => generate(false)}
            disabled={generating}
            className="text-xs text-gray-400 border border-white/10 hover:bg-white/5 disabled:opacity-50 px-3 py-1.5 rounded-lg transition"
          >
            {generating ? 'Updating…' : 'Regenerate'}
          </button>
        </div>
      </div>

      {/* Rationale */}
      <p className="text-sm text-gray-300 mb-5">{plan.overall_rationale}</p>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-white/5 p-1 rounded-lg w-fit">
        {(['risks', 'triggers', 'testing'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`text-sm px-4 py-1.5 rounded-md transition font-medium ${tab === t ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            {t === 'risks' ? `Risks (${plan.risk_items?.length ?? 0})` : t === 'triggers' ? `Change Triggers (${plan.change_triggers?.length ?? 0})` : `Testing (${plan.testing_requirements?.length ?? 0})`}
          </button>
        ))}
      </div>

      {/* Risks tab */}
      {tab === 'risks' && (
        <div className="space-y-3">
          {plan.risk_items?.map(item => (
            <div key={item.id} className="border border-white/10 rounded-lg overflow-hidden">
              <button
                className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-white/5 transition"
                onClick={() => setExpanded(expanded === item.id ? null : item.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-white">{item.risk}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{item.category} · {item.article_ref}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge value={item.probability} styles={PROB_STYLES} />
                  <Badge value={item.severity} styles={SEV_STYLES} />
                  <span className="text-gray-500 text-sm">{expanded === item.id ? '▲' : '▼'}</span>
                </div>
              </button>
              {expanded === item.id && (
                <div className="px-4 pb-4 border-t border-white/10 pt-4 space-y-3">
                  <div>
                    <div className="text-xs font-semibold text-gray-400 mb-1.5">MITIGATION MEASURES</div>
                    <ul className="space-y-1.5">
                      {item.measures.map((m, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                          <span className="text-blue-400 mt-0.5">•</span> {m}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex items-center gap-4 pt-1">
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Residual risk</div>
                      <Badge value={item.residual_risk} styles={PROB_STYLES} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-400 mb-1">Monitoring indicator</div>
                      <p className="text-sm text-gray-300">{item.monitoring_indicator}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Change triggers tab */}
      {tab === 'triggers' && (
        <div className="space-y-3">
          {plan.change_triggers?.map((t, i) => {
            const u = URGENCY_STYLES[t.urgency] ?? URGENCY_STYLES.next_review
            return (
              <div key={i} className="border border-white/10 rounded-lg p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="text-sm font-medium text-white">{t.trigger}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${u.style}`}>
                    {u.label}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mb-1">{t.article_ref}</p>
                <p className="text-sm text-gray-300">{t.required_action}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Testing tab */}
      {tab === 'testing' && (
        <div className="space-y-3">
          {plan.testing_requirements?.map((t, i) => (
            <div key={i} className="border border-white/10 rounded-lg p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <p className="text-sm font-medium text-white">{t.test}</p>
                <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded flex-shrink-0">
                  {t.frequency}
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-1.5">{t.article_ref}</p>
              <p className="text-sm text-gray-300">{t.method}</p>
            </div>
          ))}
        </div>
      )}

      {/* Residual risk communication */}
      <div className="mt-6 bg-white/5 border border-white/10 rounded-lg p-4">
        <div className="text-xs font-semibold text-gray-400 mb-2">RESIDUAL RISK COMMUNICATION (Article 9(4))</div>
        <p className="text-sm text-gray-300">{plan.residual_risk_communication}</p>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-gray-500">
        <span>Review interval: every {plan.review_interval_months} months</span>
        <span>Generated {new Date(plan.generated_at).toLocaleString()}</span>
      </div>
    </div>
  )
}
