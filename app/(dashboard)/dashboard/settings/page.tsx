import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { getPlanFeatures } from '@/lib/stripe'
import Link from 'next/link'
import { DeleteAccountButton } from './delete-account-button'

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Manage your account settings and preferences.',
}

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  starter: 'Starter',
  business: 'Business',
  enterprise: 'Enterprise',
}

const PLAN_LIMITS: Record<string, string> = {
  free: '1 system',
  starter: '5 systems',
  business: 'Unlimited',
  enterprise: 'Unlimited',
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, subscription_status, created_at')
    .eq('id', user.id)
    .single()

  const plan = profile?.plan ?? 'free'
  const planFeatures = getPlanFeatures(plan)
  const status = profile?.subscription_status ?? null
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-gray-400 text-sm mt-1">Your account details.</p>
      </div>

      {/* Account */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Account</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-white/5">
            <span className="text-sm text-gray-400">Email</span>
            <span className="text-sm font-medium">{user.email}</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-white/5">
            <span className="text-sm text-gray-400">User ID</span>
            <span className="text-xs font-mono text-gray-500">{user.id}</span>
          </div>
          {memberSince && (
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-gray-400">Member since</span>
              <span className="text-sm">{memberSince}</span>
            </div>
          )}
        </div>
      </div>

      {/* Plan */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Plan</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-white/5">
            <span className="text-sm text-gray-400">Current plan</span>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                plan === 'free' ? 'bg-gray-700 text-gray-300' : 'bg-blue-600 text-white'
              }`}>
                {PLAN_LABELS[plan] ?? plan}
              </span>
              {status && status !== 'active' && (
                <span className="text-xs text-yellow-400">{status}</span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-white/5">
            <span className="text-sm text-gray-400">Systems limit</span>
            <span className="text-sm">{PLAN_LIMITS[plan] ?? '-'}</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-gray-400">Features</span>
            <Link href="/dashboard/billing" className="text-sm text-blue-400 hover:text-blue-300 transition">
              View billing →
            </Link>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Security</h2>
        <div className="flex items-center justify-between py-3">
          <div>
            <p className="text-sm">Magic link login</p>
            <p className="text-xs text-gray-500 mt-0.5">Passwordless, a sign-in link is emailed each time you log in</p>
          </div>
          <span className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2.5 py-1 rounded-full">Active</span>
        </div>
      </div>

      {/* API Access */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-1">API Access</h2>
            <p className="text-xs text-gray-500">Programmatically run assessments and retrieve compliance data via REST API.</p>
          </div>
          {!planFeatures.apiAccess && (
            <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full shrink-0">Enterprise</span>
          )}
        </div>
        {planFeatures.apiAccess ? (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between py-3 border-b border-white/5">
              <span className="text-sm text-gray-400">API key</span>
              <a href="/dashboard/api-keys" className="text-sm text-blue-400 hover:text-blue-300 transition">Manage keys →</a>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-gray-400">Documentation</span>
              <a href="/api-docs" className="text-sm text-blue-400 hover:text-blue-300 transition">View docs →</a>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex items-center justify-between gap-4 py-3 bg-white/3 rounded-lg px-4">
            <p className="text-sm text-gray-500">Upgrade to Enterprise to access the ActComply API.</p>
            <a href="/dashboard/billing" className="shrink-0 text-sm text-blue-400 hover:text-blue-300 transition font-medium">
              Upgrade →
            </a>
          </div>
        )}
      </div>

      {/* Multi-entity */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-1">Multi-entity Management</h2>
            <p className="text-xs text-gray-500">Manage compliance across multiple legal entities or subsidiaries from one account.</p>
          </div>
          {!planFeatures.multiEntity && (
            <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full shrink-0">Enterprise</span>
          )}
        </div>
        {planFeatures.multiEntity ? (
          <div className="mt-4 py-3">
            <span className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2.5 py-1 rounded-full">Enabled</span>
          </div>
        ) : (
          <div className="mt-4 flex items-center justify-between gap-4 py-3 bg-white/3 rounded-lg px-4">
            <p className="text-sm text-gray-500">Upgrade to Enterprise for multi-entity compliance management.</p>
            <a href="/dashboard/billing" className="shrink-0 text-sm text-blue-400 hover:text-blue-300 transition font-medium">
              Upgrade →
            </a>
          </div>
        )}
      </div>

      {/* Support */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Support</h2>
        <p className="text-sm text-gray-400 mb-3">
          Need help, have a question, or want to request a feature?
        </p>
        <div className="flex gap-3">
          <Link
            href="/support"
            className="text-sm bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-lg transition"
          >
            Contact support
          </Link>
          <a
            href="mailto:support@getactcomply.com"
            className="text-sm text-gray-500 hover:text-gray-300 transition py-2"
          >
            support@getactcomply.com
          </a>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wide mb-4">Danger zone</h2>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium mb-1">Delete account</p>
            <p className="text-xs text-gray-500">Permanently deletes your account and all assessment data. This cannot be undone.</p>
          </div>
          <DeleteAccountButton />
        </div>
      </div>
    </div>
  )
}
