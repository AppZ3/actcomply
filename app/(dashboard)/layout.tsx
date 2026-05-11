import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { ACTIVE_ORG_COOKIE, getActiveOrgId, getUserOrgs } from '@/lib/active-org'
import { Sidebar } from './sidebar'
import { OrgSwitcher } from './org-switcher'

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

  // Multi-entity: load the user's orgs (owned + member) and the active workspace.
  // Sidebar renders the switcher only when the user actually has at least one org,
  // so solo users see no extra UI.
  const [orgs, activeOrgId] = await Promise.all([
    getUserOrgs(user.id),
    getActiveOrgId(),
  ])

  async function signOut() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  async function setActiveOrg(formData: FormData) {
    'use server'
    const orgId = (formData.get('orgId') as string | null) ?? ''
    const store = await cookies()
    if (!orgId || orgId === '__personal__') {
      store.delete(ACTIVE_ORG_COOKIE)
    } else {
      store.set(ACTIVE_ORG_COOKIE, orgId, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
      })
    }
    // Re-render every page with the new workspace context. Use root layout
    // scope so sibling routes (/dashboard/systems, /dashboard/orgs, /assess)
    // all pick up the new active org, not just the dashboard root.
    revalidatePath('/', 'layout')
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
        orgSwitcher={
          <OrgSwitcher orgs={orgs} activeOrgId={activeOrgId} setActiveOrg={setActiveOrg} />
        }
      />

      {/* Main, offset for desktop sidebar, top bar on mobile */}
      <main className="flex-1 md:ml-60 min-h-screen pt-14 md:pt-0">
        {children}
      </main>
    </div>
  )
}

