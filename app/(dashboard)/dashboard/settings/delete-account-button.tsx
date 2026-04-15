'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function DeleteAccountButton() {
  const router = useRouter()
  const [step, setStep] = useState<'idle' | 'confirm' | 'loading'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    setStep('loading')
    setError(null)
    const res = await fetch('/api/account', { method: 'DELETE' })
    if (res.ok) {
      router.replace('/login')
    } else {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'Something went wrong')
      setStep('confirm')
    }
  }

  if (step === 'confirm' || step === 'loading') {
    return (
      <div className="flex flex-col items-end gap-2">
        <p className="text-xs text-red-400 font-semibold text-right">Are you sure? This is permanent.</p>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={() => { setStep('idle'); setError(null) }}
            disabled={step === 'loading'}
            className="text-xs text-gray-400 hover:text-white border border-white/10 px-3 py-1.5 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={step === 'loading'}
            className="text-xs bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white font-semibold px-3 py-1.5 rounded-lg transition"
          >
            {step === 'loading' ? 'Deleting…' : 'Yes, delete everything'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setStep('confirm')}
      className="shrink-0 text-sm text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/60 px-4 py-2 rounded-lg transition"
    >
      Delete account
    </button>
  )
}
