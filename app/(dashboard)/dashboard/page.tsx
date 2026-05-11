import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { getActiveOrgId, getUserOrgs } from '@/lib/active-org'
import type { AssessmentResult, RiskLevel } from '@/lib/eu-ai-act'
import { OnboardingBanner } from './onboarding'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Overview of your AI systems, compliance scores, and EU AI Act deadline tracker.',
}

const RISK_BADGE: Record<RiskLevel, { label: string; class: string }> = {
  PROHIBITED:   { label: 'Prohibited',    class: 'bg-red-500/20 text-red-400 border-red-500/30' },
  HIGH_RISK:    { label: 'High Risk',     class: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  LIMITED_RISK: { label: 'Limited Risk',  class: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  MINIMAL_RISK: { label: 'Minimal Risk',  class: 'bg-green-500/20 text-green-400 border-green-500/30' },
}

type Assessment = AssessmentResult & {
  id: string
  name: string
  sector: string
  created_at: string
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Scope dashboard stats + recent list to the active workspace, same way
  // /dashboard/systems does. Personal workspace = user's own org_id IS NULL
  // rows; an active org = its own slice. Otherwise the headline KPIs would
  // average across personal + every org (misleading for a consultancy
  // managing many clients).
  const [activeOrgId, allOrgs, { data: profile }] = await Promise.all([
    getActiveOrgId(),
    getUserOrgs(user.id),
    supabase.from('profiles').select('*').eq('id', user.id).single(),
  ])

  let assessmentQuery = supabase
    .from('assessments')
    .select('id, name, sector, risk_level, compliance_score, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  assessmentQuery = activeOrgId
    ? assessmentQuery.eq('org_id', activeOrgId)
    : assessmentQuery.is('org_id', null).eq('user_id', user.id)

  const { data: assessments } = await assessmentQuery
  const activeOrg = activeOrgId ? allOrgs.find(o => o.id === activeOrgId) : null
  const workspaceLabel = activeOrg ? activeOrg.name : 'Personal workspace'

  const total = assessments?.length ?? 0
  const highRisk = assessments?.filter(a => a.risk_level === 'HIGH_RISK' || a.risk_level === 'PROHIBITED').length ?? 0
  const avgScore = total > 0
    ? Math.round((assessments ?? []).reduce((sum, a) => sum + a.compliance_score, 0) / total)
    : 0

  const daysLeft = Math.max(
    0,
    Math.floor((new Date('2026-08-02').getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  )

  return (
    <div className="p-8">
      {total === 0 && <OnboardingBanner userEmail={user.email ?? ''} />}
      <div className="mb-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-2xl font-bold">Overview</h1>
          {allOrgs.length > 0 && (
            <span className="text-xs px-2.5 py-1 rounded-full border border-white/10 bg-white/5 text-gray-300">
              Workspace: <span className="text-white font-medium">{workspaceLabel}</span>
            </span>
          )}
        </div>
        <p className="text-gray-400 text-sm mt-1">EU AI Act enforcement in <span className="text-red-400 font-semibold">{daysLeft} days</span></p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Systems Assessed" value={total.toString()} />
        <StatCard label="High / Prohibited Risk" value={highRisk.toString()} highlight={highRisk > 0} />
        <StatCard label="Avg Compliance Score" value={total > 0 ? `${avgScore}%` : '-'} />
        <StatCard label="Days to Deadline" value={daysLeft.toString()} highlight />
      </div>

      {/* Plan warning */}
      {profile?.plan === 'free' && (
        <div className="bg-blue-600/10 border border-blue-500/20 rounded-xl p-5 mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-sm mb-1">You&apos;re on the free plan</p>
            <p className="text-gray-400 text-sm">Upgrade to save unlimited assessments, get full compliance reports, and track changes over time.</p>
          </div>
          <Link
            href="/dashboard/billing"
            className="flex-shrink-0 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition"
          >
            Upgrade
          </Link>
        </div>
      )}

      {/* Recent systems */}
      <div className="bg-white/5 border border-white/10 rounded-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="font-semibold">Recent AI Systems</h2>
          <Link href="/dashboard/systems" className="text-sm text-blue-400 hover:text-blue-300 transition">
            View all →
          </Link>
        </div>

        {total === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-400 mb-4">No systems assessed yet.</p>
            <Link
              href="/assess"
              className="inline-block bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition"
            >
              Run your first assessment →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {(assessments ?? []).map(a => {
              const badge = RISK_BADGE[a.risk_level as RiskLevel]
              return (
                <Link
                  key={a.id}
                  href={`/dashboard/systems/${a.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-white/5 transition"
                >
                  <div>
                    <p className="font-medium text-sm">{a.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{a.sector} · {new Date(a.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-400">{a.compliance_score}%</span>
                    <span className={`text-xs px-2 py-1 rounded-full border font-semibold ${badge.class}`}>
                      {badge.label}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
      <p className="text-xs text-gray-400 mb-2">{label}</p>
      <p className={`text-3xl font-bold ${highlight ? 'text-red-400' : 'text-white'}`}>{value}</p>
    </div>
  )
}
