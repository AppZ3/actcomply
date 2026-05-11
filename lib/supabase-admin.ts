import { createClient } from '@supabase/supabase-js'

// Service role client, only use in server-side handlers, never in browser
export function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// Keep named export for backwards compat, lazily evaluated
export const supabaseAdmin = new Proxy({} as ReturnType<typeof getSupabaseAdmin>, {
  get(_target, prop) {
    return getSupabaseAdmin()[prop as keyof ReturnType<typeof getSupabaseAdmin>]
  }
})
