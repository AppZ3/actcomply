import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('redirect') || '/dashboard'
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
