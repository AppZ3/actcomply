'use client'

import { useState } from 'react'

export function UpgradeButton({ plan }: { plan: string }) {
  const [loading, setLoading] = useState(false)

  async function handleUpgrade() {
    setLoading(true)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleUpgrade}
      disabled={loading}
      className="text-sm text-blue-400 border border-blue-500/30 hover:bg-blue-500/10 px-4 py-1.5 rounded-lg transition disabled:opacity-50"
    >
      {loading ? 'Redirecting…' : 'Select'}
    </button>
  )
}
