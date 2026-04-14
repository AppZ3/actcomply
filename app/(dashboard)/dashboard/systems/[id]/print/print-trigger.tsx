'use client'

import { useEffect } from 'react'

export function PrintTrigger() {
  useEffect(() => {
    // Short delay so the page renders fully before print dialog opens
    const t = setTimeout(() => window.print(), 600)
    return () => clearTimeout(t)
  }, [])
  return null
}
