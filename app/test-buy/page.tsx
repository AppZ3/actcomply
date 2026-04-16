'use client'

import { useState } from 'react'

export default function TestBuyPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleTestBuy() {
    setLoading(true)
    setError(null)
    const res = await fetch('/api/test-checkout', { method: 'POST' })
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    } else {
      setError(data.error || 'Unknown error')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-8">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-10 max-w-md w-full text-center">
        <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center font-bold text-lg mx-auto mb-6">AI</div>
        <h1 className="text-2xl font-bold mb-2">Test Checkout</h1>
        <p className="text-gray-400 text-sm mb-2">Internal use only — tests the full purchase flow using the Starter plan.</p>
        <p className="text-yellow-400 text-xs mb-8 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
          This is a live Stripe charge. Use a real card or ask Zac before testing.
        </p>

        <div className="bg-black/30 rounded-xl p-4 mb-6 text-left space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Plan</span>
            <span>Starter</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Price</span>
            <span>€499/month</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">After payment</span>
            <span className="text-green-400">Dashboard access</span>
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-sm mb-4 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          onClick={handleTestBuy}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition"
        >
          {loading ? 'Redirecting to Stripe...' : 'Test buy now →'}
        </button>
      </div>
    </div>
  )
}
