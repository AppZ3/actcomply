import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// Reject anything that isn't a same-origin absolute path. new URL(next, base)
// treats absolute and protocol-relative inputs as fully-qualified, so an
// attacker-supplied ?redirect=https://evil.com or ?redirect=//evil.com would
// otherwise produce a cross-origin redirect.
function safeNext(next: string): string {
  if (!next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) {
    return '/dashboard'
  }
  return next
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = safeNext(url.searchParams.get('redirect') || '/dashboard')
  const baseUrl = `${url.protocol}//${url.host}`

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(new URL(next, baseUrl))
    }
    console.error('exchangeCodeForSession error:', error.message)
  }

  return NextResponse.redirect(new URL('/login?error=auth_failed', baseUrl))
}
