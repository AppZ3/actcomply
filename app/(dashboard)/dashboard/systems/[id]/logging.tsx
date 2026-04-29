'use client'

import { useState, useEffect } from 'react'

interface LogEvent {
  id: string
  name: string
  article_ref: string
  description: string
  fields_to_log: string[]
  trigger: string
}

interface LogPolicy {
  storage_format: string
  immutability: string
  access_controls: string
  integrity: string
  review_frequency: string
}

interface RetentionRow {
  record_type: string
  retention_period: string
  article: string
  disposal_method: string
}

interface LoggingSpec {
  generated_at: string
  retention_period_months: number
  retention_rationale: string
  events: LogEvent[]
  policy: LogPolicy
  retention_schedule: RetentionRow[]
}

interface Props {
  assessmentId: string
  isPaid: boolean
}

export function LoggingSpec({ assessmentId, isPaid }: Props) {
  const [spec, setSpec] = useState<LoggingSpec | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'events' | 'policy' | 'retention'>('events')

  useEffect(() => {
    fetch(`/api/logging/${assessmentId}`)
      .then(r => r.json())
      .then(d => { setSpec(d?.content ?? null); setLoading(false) })
      .catch(() => setLoading(false))
  }, [assessmentId])

  async function generate() {
    setGenerating(true)
    setGenError(null)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 120_000)
    try {
      const res = await fetch(`/api/logging/${assessmentId}`, { method: 'POST', signal: controller.signal })
      const data = await res.json()
      if (!res.ok || data.error) {
        setGenError(data.message ?? data.error ?? 'Generation failed — please try again.')
      } else {
        setSpec(data)
        setActiveTab('events')
        setExpandedEvent(null)
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
            <h2 className="font-semibold mb-1">Article 12 Logging & Article 19 Retention</h2>
            <p className="text-sm text-gray-400">
              Auto-generated logging specification: what to log, exact fields per event, and a retention schedule proving your Article 19 obligations are met.
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
        <h2 className="font-semibold mb-2">Article 12 Logging & Article 19 Retention</h2>
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!spec) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-semibold mb-1">Article 12 Logging & Article 19 Retention</h2>
            <p className="text-sm text-gray-400 max-w-lg">
              Generate a precise logging specification for this system — the exact events to log, fields to capture per event, and a retention schedule proving your Article 19 obligations are met.
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
            ) : 'Generate logging spec →'}
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

  const retentionMonths = spec.retention_period_months
  const retentionLabel = retentionMonths >= 36 ? `${retentionMonths / 12} years` : `${retentionMonths} months`

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-semibold">Article 12 Logging & Article 19 Retention</h2>
            <span className="text-xs font-mono bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full">
              {retentionLabel} retention
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Generated {new Date(spec.generated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            {' · '}{spec.events.length} events · {spec.retention_schedule.length} retention rules
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

      {/* Retention rationale banner */}
      <div className="px-6 py-3 bg-orange-500/5 border-b border-orange-500/10 text-xs text-orange-300/80">
        <span className="font-semibold text-orange-400">Article 19 determination: </span>
        {spec.retention_rationale}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        {(['events', 'policy', 'retention'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 text-xs font-medium transition capitalize ${
              activeTab === tab
                ? 'text-white border-b-2 border-blue-500 -mb-px'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab === 'events' ? `Events (${spec.events.length})` : tab === 'retention' ? 'Retention Schedule' : 'Logging Policy'}
          </button>
        ))}
      </div>

      {/* Events tab */}
      {activeTab === 'events' && (
        <div className="divide-y divide-white/5">
          {spec.events.map(event => (
            <div key={event.id}>
              <button
                onClick={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/5 transition text-left"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-sm font-medium truncate">{event.name}</span>
                  <span className="text-xs font-mono text-blue-400 shrink-0">{event.article_ref}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-gray-500">{event.fields_to_log.length} fields</span>
                  <svg
                    className={`w-4 h-4 text-gray-500 transition-transform ${expandedEvent === event.id ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
              {expandedEvent === event.id && (
                <div className="px-6 pb-5 space-y-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Description</p>
                    <p className="text-sm text-gray-300">{event.description}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Trigger</p>
                    <p className="text-sm text-gray-300">{event.trigger}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-2">Fields to log</p>
                    <div className="flex flex-wrap gap-1.5">
                      {event.fields_to_log.map((field, i) => (
                        <span
                          key={i}
                          className="text-xs font-mono bg-blue-500/10 border border-blue-500/20 text-blue-300 px-2 py-0.5 rounded"
                        >
                          {field}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Policy tab */}
      {activeTab === 'policy' && (
        <div className="divide-y divide-white/5">
          {[
            { label: 'Storage Format', key: 'storage_format' },
            { label: 'Immutability', key: 'immutability' },
            { label: 'Access Controls', key: 'access_controls' },
            { label: 'Integrity Measures', key: 'integrity' },
            { label: 'Review Frequency', key: 'review_frequency' },
          ].map(({ label, key }) => (
            <div key={key} className="px-6 py-4">
              <p className="text-xs text-gray-400 mb-1">{label}</p>
              <p className="text-sm text-gray-300">{spec.policy[key as keyof LogPolicy]}</p>
            </div>
          ))}
        </div>
      )}

      {/* Retention schedule tab */}
      {activeTab === 'retention' && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/10 text-gray-500">
                <th className="text-left px-6 py-3 font-medium">Record Type</th>
                <th className="text-left px-4 py-3 font-medium">Retention</th>
                <th className="text-left px-4 py-3 font-medium">Article</th>
                <th className="text-left px-4 py-3 font-medium">Disposal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {spec.retention_schedule.map((row, i) => (
                <tr key={i} className="hover:bg-white/5 transition">
                  <td className="px-6 py-3 text-gray-300 font-medium">{row.record_type}</td>
                  <td className="px-4 py-3">
                    <span className="text-orange-400 font-mono font-semibold">{row.retention_period}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-blue-400">{row.article}</td>
                  <td className="px-4 py-3 text-gray-400">{row.disposal_method}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  )
}
