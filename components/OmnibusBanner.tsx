'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export function OmnibusBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem('omnibus-banner-dismissed')
    if (!dismissed) setVisible(true)
  }, [])

  function dismiss() {
    localStorage.setItem('omnibus-banner-dismissed', '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="bg-amber-500 text-gray-950 px-4 py-2.5 flex items-center justify-center gap-3 text-sm font-medium">
      <span className="w-1.5 h-1.5 bg-gray-950 rounded-full shrink-0" />
      <span>
        <strong>Omnibus update:</strong> Enforcement powers went live 2 August 2026. Annex III high-risk obligations now apply from 2 December 2027.{' '}
        <Link href="/eu-ai-act-omnibus-update" className="underline underline-offset-2 hover:no-underline">
          What this means for your organisation →
        </Link>
      </span>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="ml-auto shrink-0 opacity-70 hover:opacity-100 transition text-lg leading-none"
      >
        ×
      </button>
    </div>
  )
}
