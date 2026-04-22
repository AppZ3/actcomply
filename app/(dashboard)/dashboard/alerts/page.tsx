'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Alert {
  id: string
  title: string
  summary: string
  article_refs: string
  severity: 'info' | 'warning' | 'critical'
  published_at: string
  read: boolean
}

const SEVERITY = {
  critical: { label: 'Critical', class: 'bg-red-500/10 text-red-400 border-red-500/20', dot: 'bg-red-500' },
  warning:  { label: 'Action required', class: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', dot: 'bg-yellow-500' },
  info:     { label: 'Info', class: 'bg-blue-500/10 text-blue-400 border-blue-500/20', dot: 'bg-blue-400' },
}

export default function AlertsPage() {
  const router = useRouter()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [upgradeRequired, setUpgradeRequired] = useState(false)

  async function load() {
    const res = await fetch('/api/alerts')
    if (res.status === 403) { setUpgradeRequired(true); setLoading(false); return }
    const data = await res.json()
    setAlerts(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function markRead(id: string) {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a))
    await fetch(`/api/alerts/${id}/read`, { method: 'POST' })
    router.refresh()
  }

  async function markAllRead() {
    const unread = alerts.filter(a => !a.read)
    setAlerts(prev => prev.map(a => ({ ...a, read: true })))
    await Promise.all(unread.map(a => fetch(`/api/alerts/${a.id}/read`, { method: 'POST' })))
    router.refresh()
  }

  const unreadCount = alerts.filter(a => !a.read).length

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Regulatory Alerts</h1>
          <p className="text-gray-400 text-sm mt-1">
            EU AI Act updates, deadlines, and enforcement milestones.
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-sm text-gray-400 hover:text-white border border-white/10 hover:border-white/20 px-4 py-2 rounded-lg transition"
          >
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-gray-500 text-sm">Loading...</div>
      ) : upgradeRequired ? (
        <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
          <div className="text-3xl mb-3">🔔</div>
          <h2 className="font-semibold mb-2">Regulatory Alerts require a paid plan</h2>
          <p className="text-sm text-gray-400 mb-5 max-w-sm mx-auto">Get notified of EU AI Act updates, enforcement milestones, and deadline reminders. Available on Starter and above.</p>
          <a href="/dashboard/billing" className="inline-block bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition">
            Upgrade now →
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map(alert => {
            const sev = SEVERITY[alert.severity]
            return (
              <div
                key={alert.id}
                className={`border rounded-xl p-5 transition ${
                  alert.read
                    ? 'bg-white/3 border-white/10 opacity-60'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {!alert.read && (
                      <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${sev.dot}`} />
                    )}
                    <div className={alert.read ? 'ml-5' : ''}>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${sev.class}`}>
                          {sev.label}
                        </span>
                        {alert.article_refs && (
                          <span className="text-xs font-mono text-blue-400">{alert.article_refs}</span>
                        )}
                        <span className="text-xs text-gray-500">
                          {new Date(alert.published_at).toLocaleDateString('en-GB', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </span>
                      </div>
                      <h3 className="font-semibold text-sm mb-1">{alert.title}</h3>
                      <p className="text-sm text-gray-400 leading-relaxed">{alert.summary}</p>
                    </div>
                  </div>
                  {!alert.read && (
                    <button
                      onClick={() => markRead(alert.id)}
                      className="text-xs text-gray-500 hover:text-gray-300 shrink-0 transition"
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
