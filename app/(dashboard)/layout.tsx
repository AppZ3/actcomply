import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

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
      {/* Sidebar */}
      <aside className="w-60 border-r border-white/10 flex flex-col fixed h-full">
        <div className="px-5 py-5 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-xs">AI</div>
            <span className="font-semibold">ActComply</span>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavLink href="/dashboard" label="Overview" icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          } />
          <NavLink href="/dashboard/systems" label="AI Systems" icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
            </svg>
          } />
          <NavLink href="/dashboard/billing" label="Billing" icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          } />
          <NavLink href="/dashboard/alerts" label="Alerts" badge={unreadAlerts} icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          } />
          <Link
            href="/assess"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-blue-400 hover:bg-blue-500/10 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Assessment
          </Link>
        </nav>

        <div className="px-3 py-4 border-t border-white/10 space-y-3">
          {/* Plan badge */}
          <div className="px-3 py-2 bg-white/5 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400">Plan</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                plan === 'free' ? 'bg-gray-700 text-gray-300' : 'bg-blue-600 text-white'
              }`}>
                {PLAN_LABELS[plan] ?? plan}
              </span>
            </div>
            {plan === 'free' && (
              <Link href="/#pricing" className="text-xs text-blue-400 hover:text-blue-300 transition">
                Upgrade →
              </Link>
            )}
            {plan !== 'free' && !isActive && (
              <span className="text-xs text-yellow-400">Payment issue</span>
            )}
          </div>

          {/* User + sign out */}
          <div className="px-3 py-2">
            <p className="text-xs text-gray-500 truncate mb-2">{user.email}</p>
            <form action={signOut}>
              <button type="submit" className="text-xs text-gray-400 hover:text-white transition">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-60 min-h-screen">
        {children}
      </main>
    </div>
  )
}

function NavLink({ href, label, icon, badge }: { href: string; label: string; icon: React.ReactNode; badge?: number }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5 transition"
    >
      {icon}
      <span className="flex-1">{label}</span>
      {badge != null && badge > 0 && (
        <span className="bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </Link>
  )
}
