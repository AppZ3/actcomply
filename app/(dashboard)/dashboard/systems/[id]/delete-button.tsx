'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function DeleteSystemButton({ assessmentId }: { assessmentId: string }) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleDelete() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/assessments/${assessmentId}`, { method: 'DELETE' })
      if (!res.ok) { setError('Delete failed. Please try again.'); setLoading(false); return }
      router.push('/dashboard/systems')
      router.refresh()
    } catch {
      setError('Delete failed. Please try again.')
      setLoading(false)
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400">Delete this system?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-xs text-red-400 border border-red-500/30 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
        >
          {loading ? 'Deleting…' : 'Yes, delete'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs text-gray-500 hover:text-gray-300 transition"
        >
          Cancel
        </button>
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-sm text-gray-500 hover:text-red-400 border border-white/10 hover:border-red-500/30 px-4 py-2 rounded-lg transition"
    >
      Delete
    </button>
  )
}
