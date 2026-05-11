'use client'

import { useState, useEffect } from 'react'

// YYYY-MM-DD in the user's local timezone (default new Date().toISOString()
// returns UTC, which is yesterday for evening AU timezones).
function localToday(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

type Severity = 'immediate_risk' | 'serious' | 'malfunction' | 'near_miss'
type Status = 'discovered' | 'under_review' | 'reported' | 'resolved'

interface Incident {
  id: string
  title: string
  description: string
  severity: Severity
  discovery_date: string
  reporting_deadline: string | null
  status: Status
  authority_name: string | null
  report_reference: string | null
  reported_at: string | null
  notes: string | null
  created_at: string
}

const SEV_CONFIG: Record<Severity, { label: string; color: string; bg: string; deadline: string }> = {
  immediate_risk: { label: 'Immediate Risk', color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/30',    deadline: '24 hours' },
  serious:        { label: 'Serious',        color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30', deadline: '15 days' },
  malfunction:    { label: 'Malfunction',    color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30', deadline: '3 months' },
  near_miss:      { label: 'Near Miss',      color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/30',   deadline: 'Log only' },
}

const STATUS_CONFIG: Record<Status, { label: string; color: string }> = {
  discovered:   { label: 'Discovered',   color: 'text-gray-400' },
  under_review: { label: 'Under review', color: 'text-yellow-400' },
  reported:     { label: 'Reported',     color: 'text-blue-400' },
  resolved:     { label: 'Resolved',     color: 'text-green-400' },
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / 86_400_000)
}

interface Props {
  assessmentId: string
  isPaid: boolean
}

export function IncidentLog({ assessmentId, isPaid }: Props) {
  const [open, setOpen] = useState(false)
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: '', description: '', severity: 'serious' as Severity,
    discovery_date: localToday(), notes: '',
  })

  useEffect(() => {
    if (!open || !isPaid) return
    setLoading(true)
    fetch(`/api/incidents/${assessmentId}`)
      .then(r => r.json())
      .then(d => setIncidents(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [open, assessmentId, isPaid])

  async function submitIncident() {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/incidents/${assessmentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to log incident')
      setIncidents(prev => [data, ...prev])
      setShowForm(false)
      setForm({ title: '', description: '', severity: 'serious', discovery_date: localToday(), notes: '' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log incident')
    } finally {
      setSubmitting(false)
    }
  }

  async function updateStatus(id: string, patch: Partial<Incident>) {
    try {
      const res = await fetch(`/api/incidents/${assessmentId}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      const data = await res.json()
      if (res.ok) setIncidents(prev => prev.map(i => i.id === id ? data : i))
    } catch {}
  }

  if (!isPaid) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-5 flex items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-sm mb-0.5">Article 72/73, Incident Log</p>
          <p className="text-xs text-gray-500">Log and track serious incidents with auto-calculated Article 73 reporting deadlines.</p>
        </div>
        <a href="/dashboard/billing" className="shrink-0 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition">
          Business plan →
        </a>
      </div>
    )
  }

  const overdueCount = incidents.filter(i =>
    i.reporting_deadline && i.status !== 'reported' && i.status !== 'resolved' && daysUntil(i.reporting_deadline)! < 0
  ).length

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-white/5 transition"
      >
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h2 className="font-semibold">Article 72/73, Incident Log</h2>
            {overdueCount > 0 && (
              <span className="text-xs font-mono bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full">
                {overdueCount} overdue
              </span>
            )}
            {incidents.length > 0 && overdueCount === 0 && (
              <span className="text-xs font-mono bg-white/10 text-gray-400 border border-white/10 px-2 py-0.5 rounded-full">
                {incidents.length} logged
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500">Post-market monitoring and serious incident reporting (Article 72–73)</p>
        </div>
        <svg className={`w-4 h-4 text-gray-500 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-white/10">
          {/* Context banner */}
          <div className="px-6 py-3 bg-orange-500/5 border-b border-orange-500/10">
            <p className="text-xs text-orange-300/80">
              <span className="font-semibold text-orange-400">Article 73 obligation: </span>
              Serious incidents must be reported to the relevant national market surveillance authority. Deadlines: 24 hours (immediate risk) · 15 days (serious) · 3 months (malfunction). Near misses require logging only.
            </p>
          </div>

          {/* Incident list */}
          <div className="px-6 py-4">
            {loading ? (
              <p className="text-xs text-gray-500">Loading...</p>
            ) : incidents.length === 0 ? (
              <p className="text-xs text-gray-500 mb-4">No incidents logged. Use this log to record any serious incidents, malfunctions, or near misses for Article 72 post-market monitoring.</p>
            ) : (
              <div className="space-y-2 mb-4">
                {incidents.map(incident => {
                  const sev = SEV_CONFIG[incident.severity]
                  const sta = STATUS_CONFIG[incident.status]
                  const days = daysUntil(incident.reporting_deadline)
                  const overdue = days !== null && days < 0 && incident.status !== 'reported' && incident.status !== 'resolved'
                  const isExpanded = expandedId === incident.id

                  return (
                    <div key={incident.id} className={`border rounded-lg overflow-hidden ${overdue ? 'border-red-500/30' : 'border-white/10'}`}>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : incident.id)}
                        className="w-full flex items-start justify-between p-3 text-left hover:bg-white/5 transition"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${sev.bg} ${sev.color}`}>
                              {sev.label}
                            </span>
                            <span className={`text-xs font-semibold ${sta.color}`}>{sta.label}</span>
                            {days !== null && incident.status !== 'reported' && incident.status !== 'resolved' && (
                              <span className={`text-xs font-mono ${overdue ? 'text-red-400' : days <= 3 ? 'text-orange-400' : 'text-gray-500'}`}>
                                {overdue ? `${Math.abs(days)}d overdue` : `${days}d left`}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-white truncate">{incident.title}</p>
                          <p className="text-xs text-gray-500">Discovered {new Date(incident.discovery_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        </div>
                        <svg className={`w-4 h-4 text-gray-500 shrink-0 mt-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {isExpanded && (
                        <div className="border-t border-white/10 p-3 space-y-3">
                          <p className="text-xs text-gray-400 leading-relaxed">{incident.description}</p>

                          {incident.reporting_deadline && (
                            <div className="text-xs text-gray-500">
                              Reporting deadline: <span className="text-white font-mono">{incident.reporting_deadline}</span>
                              {incident.severity !== 'near_miss' && (
                                <span className="text-gray-600 ml-1">({sev.deadline} from discovery)</span>
                              )}
                            </div>
                          )}

                          {incident.reported_at && (
                            <div className="text-xs text-gray-500">
                              Reported: <span className="text-green-400">{new Date(incident.reported_at).toLocaleDateString('en-GB')}</span>
                              {incident.authority_name && <span className="text-gray-500"> to {incident.authority_name}</span>}
                              {incident.report_reference && <span className="text-gray-600"> · Ref: {incident.report_reference}</span>}
                            </div>
                          )}

                          {incident.notes && <p className="text-xs text-gray-500 italic">{incident.notes}</p>}

                          <div className="flex flex-wrap gap-2 pt-1">
                            {incident.status === 'discovered' && (
                              <button onClick={() => updateStatus(incident.id, { status: 'under_review' })}
                                className="text-xs border border-white/10 hover:bg-white/5 px-3 py-1 rounded-lg transition">
                                Mark under review
                              </button>
                            )}
                            {(incident.status === 'discovered' || incident.status === 'under_review') && incident.severity !== 'near_miss' && (
                              <button onClick={() => updateStatus(incident.id, { status: 'reported' })}
                                className="text-xs border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 px-3 py-1 rounded-lg transition">
                                Mark reported
                              </button>
                            )}
                            {incident.status !== 'resolved' && (
                              <button onClick={() => updateStatus(incident.id, { status: 'resolved' })}
                                className="text-xs border border-green-500/30 text-green-400 hover:bg-green-500/10 px-3 py-1 rounded-lg transition">
                                Resolve
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Create form */}
            {showForm ? (
              <div className="border border-white/15 rounded-lg p-4 space-y-3">
                <p className="text-sm font-semibold">Log new incident</p>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Title</label>
                  <input
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Brief description of the incident"
                    className="w-full text-sm bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-white/30"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Description</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    rows={3}
                    placeholder="What happened, who was affected, what was the impact?"
                    className="w-full text-sm bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-white/30 resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Severity</label>
                    <select
                      value={form.severity}
                      onChange={e => setForm(f => ({ ...f, severity: e.target.value as Severity }))}
                      className="w-full text-sm bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white/30"
                    >
                      <option value="immediate_risk">Immediate Risk (24h deadline)</option>
                      <option value="serious">Serious (15-day deadline)</option>
                      <option value="malfunction">Malfunction (3-month log)</option>
                      <option value="near_miss">Near Miss (log only)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Discovery Date</label>
                    <input
                      type="date"
                      value={form.discovery_date}
                      onChange={e => setForm(f => ({ ...f, discovery_date: e.target.value }))}
                      className="w-full text-sm bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white/30"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Notes (optional)</label>
                  <input
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Initial investigation notes, affected users, etc."
                    className="w-full text-sm bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-white/30"
                  />
                </div>
                {error && <p className="text-xs text-red-400">{error}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={submitIncident}
                    disabled={submitting || !form.title || !form.description}
                    className="text-sm bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition"
                  >
                    {submitting ? 'Logging...' : 'Log incident'}
                  </button>
                  <button onClick={() => { setShowForm(false); setError(null) }} className="text-sm text-gray-400 hover:text-white px-4 py-2 transition">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowForm(true)}
                className="text-sm border border-orange-500/30 text-orange-400 hover:bg-orange-500/10 px-4 py-2 rounded-lg transition"
              >
                + Log incident
              </button>
            )}
          </div>

          <div className="px-6 py-3 border-t border-white/10">
            <p className="text-xs text-gray-500">
              Article 72 requires systematic collection and analysis of incident data throughout the system lifecycle. Article 73 requires reporting serious incidents to the relevant national market surveillance authority without undue delay.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
