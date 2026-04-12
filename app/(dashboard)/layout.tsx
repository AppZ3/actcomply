import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'

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

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, subscription_status')
    .eq('id', user.id)
    .single()

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

function NavLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5 transition"
    >
      {icon}
      {label}
    </Link>
  )
}
