'use client'

import { useState } from 'react'
import type { ComplianceRequirement } from '@/lib/eu-ai-act'

type Status = 'not_started' | 'in_progress' | 'done'

const STATUS_CONFIG: Record<Status, { label: string; icon: string; class: string; next: Status }> = {
  not_started: {
    label: 'Not started',
    icon: '○',
    class: 'text-gray-500 border-gray-600',
    next: 'in_progress',
  },
  in_progress: {
    label: 'In progress',
    icon: '◑',
    class: 'text-yellow-400 border-yellow-500/50',
    next: 'done',
  },
  done: {
    label: 'Done',
    icon: '✓',
    class: 'text-green-400 border-green-500/50',
    next: 'not_started',
  },
}

interface Props {
  assessmentId: string
  requirements: ComplianceRequirement[]
  initialProgress: Record<string, { status: string; notes: string }>
  doneCount: number
}

export function ComplianceChecklist({ assessmentId, requirements, initialProgress, doneCount: initialDone }: Props) {
  const [progress, setProgress] = useState<Record<string, { status: Status; notes: string }>>(() => {
    const map: Record<string, { status: Status; notes: string }> = {}
    for (const req of requirements) {
      map[req.id] = {
        status: (initialProgress[req.id]?.status as Status) ?? 'not_started',
        notes: initialProgress[req.id]?.notes ?? '',
      }
    }
    return map
  })
  const [saving, setSaving] = useState<string | null>(null)
  const [expandedNotes, setExpandedNotes] = useState<string | null>(null)

  const doneCount = Object.values(progress).filter(p => p.status === 'done').length
  const inProgressCount = Object.values(progress).filter(p => p.status === 'in_progress').length
  const pct = requirements.length > 0 ? Math.round((doneCount / requirements.length) * 100) : 0

  async function cycleStatus(reqId: string) {
    const current = progress[reqId]?.status ?? 'not_started'
    const next = STATUS_CONFIG[current].next
    setProgress(prev => ({ ...prev, [reqId]: { ...prev[reqId], status: next } }))
    setSaving(reqId)
    await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assessmentId,
        requirementId: reqId,
        status: next,
        notes: progress[reqId]?.notes ?? '',
      }),
    })
    setSaving(null)
  }

  async function saveNotes(reqId: string, notes: string) {
    setProgress(prev => ({ ...prev, [reqId]: { ...prev[reqId], notes } }))
    await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assessmentId,
        requirementId: reqId,
        status: progress[reqId]?.status ?? 'not_started',
        notes,
      }),
    })
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      {/* Header + progress bar */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-semibold">Compliance Checklist</h2>
        <span className="text-sm text-gray-400">
          {doneCount} / {requirements.length} complete
        </span>
      </div>

      <div className="flex items-center gap-3 mb-1">
        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-sm font-semibold text-green-400 w-10 text-right">{pct}%</span>
      </div>

      <div className="flex gap-4 text-xs text-gray-500 mb-6">
        <span className="text-green-400">{doneCount} done</span>
        <span className="text-yellow-400">{inProgressCount} in progress</span>
        <span>{requirements.length - doneCount - inProgressCount} not started</span>
      </div>

      {/* Requirement rows */}
      <div className="space-y-2">
        {requirements.map(req => {
          const p = progress[req.id] ?? { status: 'not_started' as Status, notes: '' }
          const s = STATUS_CONFIG[p.status]
          const isExpanded = expandedNotes === req.id

          return (
            <div
              key={req.id}
              className={`border rounded-lg transition-colors ${
                p.status === 'done'
                  ? 'border-green-500/20 bg-green-500/5'
                  : p.status === 'in_progress'
                  ? 'border-yellow-500/20 bg-yellow-500/5'
                  : 'border-white/10'
              }`}
            >
              <div className="flex items-start gap-3 p-4">
                {/* Status toggle */}
                <button
                  onClick={() => cycleStatus(req.id)}
                  disabled={saving === req.id}
                  className={`shrink-0 w-7 h-7 rounded-full border flex items-center justify-center text-sm font-bold transition ${s.class} hover:scale-110`}
                  title={`Click to mark as ${STATUS_CONFIG[s.next].label}`}
                >
                  {saving === req.id ? (
                    <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                  ) : s.icon}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-mono text-blue-400 mr-2">{req.article}</span>
                      <span className={`text-sm font-semibold ${p.status === 'done' ? 'line-through text-gray-500' : ''}`}>
                        {req.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        req.effort === 'HIGH' ? 'bg-red-500/20 text-red-400' :
                        req.effort === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {req.effort}
                      </span>
                      <button
                        onClick={() => setExpandedNotes(isExpanded ? null : req.id)}
                        className="text-xs text-gray-500 hover:text-gray-300 transition"
                      >
                        {isExpanded ? 'Hide notes' : p.notes ? 'Edit notes' : 'Add notes'}
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{req.description}</p>
                  <p className="text-xs text-gray-500 mt-1">Deadline: {req.deadline}</p>

                  {/* Notes */}
                  {isExpanded && (
                    <textarea
                      defaultValue={p.notes}
                      rows={2}
                      placeholder="Add notes, links, or evidence of completion..."
                      onBlur={e => saveNotes(req.id, e.target.value)}
                      className="w-full mt-3 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none"
                    />
                  )}
                  {!isExpanded && p.notes && (
                    <p className="text-xs text-gray-500 mt-1.5 italic truncate">{p.notes}</p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
