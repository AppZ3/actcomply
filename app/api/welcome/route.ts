import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// Called client-side after magic link auth, sends welcome email to brand new users only
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ sent: false })

  const { data: profile } = await supabase
    .from('profiles')
    .select('created_at')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ sent: false })

  // Only send welcome email if account is less than 2 minutes old
  const ageMs = Date.now() - new Date(profile.created_at).getTime()
  if (ageMs > 2 * 60 * 1000) return NextResponse.json({ sent: false })

  const email = user.email
  if (!email) return NextResponse.json({ sent: false })

  try {
    const { sendWelcomeEmail } = await import('@/lib/resend')
    await sendWelcomeEmail({ to: email })
    return NextResponse.json({ sent: true })
  } catch {
    return NextResponse.json({ sent: false })
  }
}
