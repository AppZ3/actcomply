'use client'

import { useState } from 'react'

export function ManageBillingButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const text = await res.text()
      let data: { url?: string; error?: string } = {}
      try { data = JSON.parse(text) } catch { /* non-JSON response */ }
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error ?? `Error ${res.status}, please contact support`)
        setLoading(false)
      }
    } catch {
      setError('Network error, please try again')
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="text-sm text-gray-300 hover:text-white border border-white/10 hover:border-white/20 px-4 py-2 rounded-lg transition disabled:opacity-50"
      >
        {loading ? 'Opening…' : 'Manage billing & invoices →'}
      </button>
      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
    </div>
  )
}
