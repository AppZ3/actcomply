import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { getActiveOrgId } from '@/lib/active-org'
import type { RiskLevel } from '@/lib/eu-ai-act'

export const metadata: Metadata = {
  title: 'AI Systems',
  description: 'All your assessed AI systems, risk levels, and compliance scores.',
}

const RISK_BADGE: Record<RiskLevel, { label: string; class: string }> = {
  PROHIBITED:   { label: 'Prohibited',    class: 'bg-red-500/20 text-red-400 border-red-500/30' },
  HIGH_RISK:    { label: 'High Risk',     class: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  LIMITED_RISK: { label: 'Limited Risk',  class: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  MINIMAL_RISK: { label: 'Minimal Risk',  class: 'bg-green-500/20 text-green-400 border-green-500/30' },
}

export default async function SystemsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Scope the list to the active workspace. Personal workspace = the user's
  // own assessments without an org. Active org = whatever the user selected
  // in the workspace switcher (RLS already restricts to orgs they can access).
  const activeOrgId = await getActiveOrgId()
  let query = supabase
    .from('assessments')
    .select('id, name, sector, risk_level, compliance_score, immediate_actions, created_at')
    .order('created_at', { ascending: false })
  query = activeOrgId
    ? query.eq('org_id', activeOrgId)
    : query.is('org_id', null).eq('user_id', user.id)
  const { data: assessments } = await query

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">AI Systems</h1>
          <p className="text-gray-400 text-sm mt-1">{assessments?.length ?? 0} system{assessments?.length !== 1 ? 's' : ''} assessed</p>
        </div>
        <Link
          href="/assess"
          className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition"
        >
          + Assess new system
        </Link>
      </div>

      {!assessments?.length ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-16 text-center">
          <p className="text-gray-400 mb-4">No AI systems assessed yet.</p>
          <Link
            href="/assess"
            className="inline-block bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition"
          >
            Run your first assessment →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {assessments.map(a => {
            const badge = RISK_BADGE[a.risk_level as RiskLevel]
            const actions = (a.immediate_actions ?? []) as string[]
            return (
              <Link
                key={a.id}
                href={`/dashboard/systems/${a.id}`}
                className="block bg-white/5 border border-white/10 hover:border-white/20 rounded-xl p-5 transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold truncate">{a.name}</h3>
                      <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full border font-semibold ${badge.class}`}>
                        {badge.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">{a.sector}</p>
                    {actions[0] && (
                      <p className="text-xs text-gray-500 mt-2 truncate">
                        Next action: {actions[0]}
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-2xl font-bold text-white mb-0.5">{a.compliance_score}%</div>
                    <div className="text-xs text-gray-500">compliance</div>
                    <div className="text-xs text-gray-500 mt-2">{new Date(a.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
