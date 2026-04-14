'use client'

import { useEffect, useState } from 'react'

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent')
    if (!consent) setVisible(true)
  }, [])

  function accept() {
    localStorage.setItem('cookie_consent', 'accepted')
    setVisible(false)
  }

  function decline() {
    localStorage.setItem('cookie_consent', 'declined')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-white/10 px-6 py-4">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <p className="text-sm text-gray-300 max-w-2xl">
          We use essential cookies to keep you signed in and functional cookies to improve your experience.
          See our{' '}
          <a href="/privacy" className="text-blue-400 hover:underline">Privacy Policy</a>{' '}
          for details.
        </p>
        <div className="flex gap-3 shrink-0">
          <button
            onClick={decline}
            className="text-sm border border-white/20 hover:border-white/40 text-gray-400 hover:text-white px-4 py-2 rounded-lg transition"
          >
            Decline
          </button>
          <button
            onClick={accept}
            className="text-sm bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-lg transition"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}
