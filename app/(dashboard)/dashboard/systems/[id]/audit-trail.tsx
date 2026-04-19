'use client'

import { useState, useEffect } from 'react'

interface AuditEntry {
  id: string
  action: string
  detail: { requirement_id: string; status: string; notes?: string }
  created_at: string
}

const STATUS_LABELS: Record<string, { label: string; class: string }> = {
  not_started: { label: 'Not started', class: 'text-gray-400' },
  in_progress:  { label: 'In progress', class: 'text-yellow-400' },
  done:         { label: 'Done',        class: 'text-green-400' },
}

export function AuditTrail({ assessmentId, enabled = true }: { assessmentId: string; enabled?: boolean }) {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open || !enabled) return
    fetch(`/api/audit?assessmentId=${assessmentId}`)
      .then(r => r.json())
      .then(d => { setEntries(d ?? []); setLoading(false) })
  }, [open, assessmentId, enabled])

  if (!enabled) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-5 flex items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-sm mb-0.5">Audit Trail</p>
          <p className="text-xs text-gray-500">Full change log for regulators — every compliance update timestamped and recorded.</p>
        </div>
        <a href="/dashboard/billing" className="shrink-0 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition">
          Business plan →
        </a>
      </div>
    )
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/5 transition"
      >
        <span className="font-semibold text-sm">Audit Trail</span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-white/10 px-6 py-4">
          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : entries.length === 0 ? (
            <p className="text-sm text-gray-500">No changes recorded yet. Checklist updates will appear here.</p>
          ) : (
            <div className="space-y-2">
              {entries.map(entry => {
                const s = STATUS_LABELS[entry.detail.status]
                return (
                  <div key={entry.id} className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-2" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono text-gray-500">{entry.detail.requirement_id}</span>
                        <span className="text-xs text-gray-500">→</span>
                        <span className={`text-xs font-semibold ${s?.class ?? 'text-gray-400'}`}>
                          {s?.label ?? entry.detail.status}
                        </span>
                        {entry.detail.notes && (
                          <span className="text-xs text-gray-600 italic truncate max-w-xs">
                            "{entry.detail.notes}"
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-600 shrink-0">
                      {new Date(entry.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
