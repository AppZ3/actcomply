'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ConfirmingPage() {
  const router = useRouter()

  useEffect(() => {
    // Small delay so the UI renders before navigating, then go to dashboard
    const t = setTimeout(() => router.replace('/dashboard'), 100)
    return () => clearTimeout(t)
  }, [router])

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center font-bold text-sm text-white">
          AI
        </div>
        <span className="text-white font-semibold text-lg">ActComply</span>
      </div>

      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Signing you in…</p>
      </div>
    </div>
  )
}
