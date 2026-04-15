import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { Sidebar } from './sidebar'

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  starter: 'Starter',
  business: 'Business',
  enterprise: 'Enterprise',
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const admin = getSupabaseAdmin()

  // Count unread alerts for badge
  const [{ data: profile }, { count: totalAlerts }, { count: readAlerts }] = await Promise.all([
    supabase.from('profiles').select('plan, subscription_status').eq('id', user.id).single(),
    admin.from('regulatory_alerts').select('*', { count: 'exact', head: true }),
    admin.from('alert_reads').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
  ])

  const unreadAlerts = Math.max(0, (totalAlerts ?? 0) - (readAlerts ?? 0))

  const plan = profile?.plan ?? 'free'
  const isActive = profile?.subscription_status === 'active'

  async function signOut() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      <Sidebar
        plan={plan}
        planLabel={PLAN_LABELS[plan] ?? plan}
        isActive={isActive}
        email={user.email ?? ''}
        unreadAlerts={unreadAlerts}
        signOut={signOut}
      />

      {/* Main — offset for desktop sidebar, top bar on mobile */}
      <main className="flex-1 md:ml-60 min-h-screen pt-14 md:pt-0">
        {children}
      </main>
    </div>
  )
}

