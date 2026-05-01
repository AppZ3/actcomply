import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { getPlanFeatures } from '@/lib/stripe'
import Link from 'next/link'
import { ApiKeyManager } from './manager'

export default async function ApiKeysPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
  const features = getPlanFeatures(profile?.plan)

  if (!features.apiAccess) {
    return (
      <div className="p-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-2">Public API</h1>
        <p className="text-gray-400 text-sm mb-6">Programmatic access to the ActComply assessment engine</p>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-lg font-semibold mb-2">Enterprise Feature</h2>
          <p className="text-gray-400 text-sm mb-6">
            API access is available on the Enterprise plan. Integrate the ActComply assessment engine
            directly into your own tools, workflows, and compliance pipelines.
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

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-1">Public API</h1>
      <p className="text-gray-400 text-sm mb-8">Integrate the ActComply assessment engine into your own tools</p>

      <ApiKeyManager />

      <div className="mt-8 bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 className="font-semibold mb-4">API Reference</h2>

        <div className="space-y-6 text-sm text-gray-300">
          <div>
            <div className="font-mono text-xs bg-black/30 rounded px-3 py-2 mb-2 text-green-400">
              POST https://getactcomply.com/api/v1/assess
            </div>
            <p className="text-gray-400 mb-3">Run an EU AI Act risk assessment. Returns risk level, compliance score, requirements, and immediate actions.</p>
            <div className="font-mono text-xs bg-black/30 rounded p-3 whitespace-pre text-gray-300">{`Authorization: Bearer ac_<your-key>
Content-Type: application/json

{
  "name": "My AI System",
  "description": "...",
  "purpose": "...",
  "sector": "Healthcare",
  "usesPersonalData": true,
  "isAutomatedDecision": false,
  "affectsVulnerableGroups": false,
  "deployedInEU": true,
  "intendedUsers": "Medical professionals"
}`}</div>
          </div>

          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Response</div>
            <div className="font-mono text-xs bg-black/30 rounded p-3 whitespace-pre text-gray-300">{`{
  "risk_level": "HIGH_RISK",
  "compliance_score": 42,
  "risk_rationale": "...",
  "regulatory_basis": "Article 6(2)...",
  "requirements": [...],
  "immediate_actions": [...],
  "estimated_effort": "120–180 hours"
}`}</div>
          </div>

          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Required fields</div>
            <ul className="space-y-1 text-gray-400">
              <li><span className="font-mono text-gray-200">name</span> — system name</li>
              <li><span className="font-mono text-gray-200">description</span> — what the system does</li>
              <li><span className="font-mono text-gray-200">purpose</span> — business purpose and use case</li>
              <li><span className="font-mono text-gray-200">sector</span> — industry sector</li>
            </ul>
          </div>

          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Rate limits</div>
            <p className="text-gray-400">Enterprise plan: 100 requests/day per API key. Contact support for higher limits.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
