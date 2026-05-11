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
    let done = false

    function succeed() {
      if (done) return
      done = true
      fetch('/api/welcome', { method: 'POST' }).catch(() => {})
      router.replace(next)
    }

    function fail() {
      if (done) return
      done = true
      router.replace('/login?error=auth_failed')
    }

    // Listen for auth state, catches auto-detected implicit sessions
    // (createBrowserClient processes #access_token hash before useEffect runs)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) succeed()
    })

    // PKCE flow, ?code= in query string
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) fail()
      })
      return () => subscription.unsubscribe()
    }

    // Implicit flow fallback, manually parse hash if client hasn't auto-processed it
    const hash = typeof window !== 'undefined' ? window.location.hash : ''
    if (hash.includes('access_token=')) {
      const params = new URLSearchParams(hash.slice(1))
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')
      if (accessToken && refreshToken) {
        supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
          .then(({ error }) => { if (error) fail() })
      } else {
        fail()
      }
      return () => subscription.unsubscribe()
    }

    // Check if session already exists (auto-processed before this effect ran)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) succeed()
      else fail()
    })

    return () => subscription.unsubscribe()
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
