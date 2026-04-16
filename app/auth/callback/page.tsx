'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const Spinner = () => (
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

function CallbackInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const code = searchParams.get('code')
    const next = searchParams.get('redirect') || '/dashboard'
    const supabase = createClient()

    // PKCE flow — ?code= in query string
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          router.replace('/login?error=auth_failed')
        } else {
          fetch('/api/welcome', { method: 'POST' }).catch(() => {})
          router.replace(next)
        }
      })
      return
    }

    // Implicit flow — #access_token= in hash (invite links)
    if (typeof window !== 'undefined' && window.location.hash.includes('access_token=')) {
      supabase.auth.getSession().then(({ data, error }) => {
        if (error || !data.session) {
          router.replace('/login?error=auth_failed')
        } else {
          fetch('/api/welcome', { method: 'POST' }).catch(() => {})
          router.replace('/dashboard')
        }
      })
      return
    }

    router.replace('/login?error=auth_failed')
  }, [router, searchParams])

  return <Spinner />
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <CallbackInner />
    </Suspense>
  )
}
