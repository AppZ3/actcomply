import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { getPlanFeatures } from '@/lib/stripe'
import { getActiveOrgId, getUserOrgs } from '@/lib/active-org'
import Link from 'next/link'
import { OrgManager } from './manager'

export const metadata = { title: 'Entities' }

export default async function OrgsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
  const features = getPlanFeatures(profile?.plan)

  if (!features.multiEntity) {
    return (
      <div className="p-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-2">Entity Management</h1>
        <p className="text-gray-400 text-sm mb-6">Manage compliance across multiple legal entities</p>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
          <div className="text-4xl mb-4">🏢</div>
          <h2 className="text-lg font-semibold mb-2">Enterprise Feature</h2>
          <p className="text-gray-400 text-sm mb-6">
            Multi-entity management lets you organise AI systems and compliance records across different
            legal entities, subsidiaries, or business units, all under one account.
          </p>
          <Link
            href="/#pricing"
            className="inline-block text-sm bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg transition font-medium"
          >
            Upgrade to Enterprise
          </Link>
        </div>
      </div>
    )
  }

  const [activeOrgId, allOrgs] = await Promise.all([getActiveOrgId(), getUserOrgs(user.id)])
  const activeOrg = activeOrgId ? allOrgs.find(o => o.id === activeOrgId) : null
  const activeLabel = activeOrg ? activeOrg.name : 'Personal workspace'

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-1">Entity Management</h1>
      <p className="text-gray-400 text-sm mb-6">
        Organise AI systems across legal entities. Invite team members to share compliance access.
      </p>

      <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-8 flex items-center justify-between gap-3 flex-wrap">
        <div className="text-sm text-gray-300">
          Currently viewing <span className="font-semibold text-white">{activeLabel}</span>.
          {' '}This page is for <em>managing</em> entities. To switch which entity&apos;s data you see across the dashboard, use the <span className="font-medium text-white">Workspace</span> dropdown in the sidebar.
        </div>
      </div>

      <OrgManager userId={user.id} />
    </div>
  )
}
