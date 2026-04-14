'use client'

import { useState } from 'react'

export function UpgradedBanner({ plan }: { plan: string }) {
  const [visible, setVisible] = useState(true)
  if (!visible) return null

  return (
    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-green-400">You're now on the {plan.charAt(0).toUpperCase() + plan.slice(1)} plan</p>
          <p className="text-xs text-gray-400 mt-0.5">All features are unlocked. Welcome aboard.</p>
        </div>
      </div>
      <button onClick={() => setVisible(false)} className="text-gray-500 hover:text-gray-300 transition shrink-0">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
