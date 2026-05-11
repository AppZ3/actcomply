import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { getPlanFeatures } from '@/lib/stripe'
import Link from 'next/link'
import { ApiKeyManager } from './manager'

export const metadata = { title: 'API Keys' }

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
              POST https://www.getactcomply.com/api/v1/assess
            </div>
            <p className="text-gray-400 mb-3">Run an EU AI Act risk assessment. Returns risk level, compliance score, requirements, and immediate actions.</p>
            <div className="font-mono text-xs bg-black/30 rounded p-3 whitespace-pre text-gray-300">{`Authorization: Bearer ac_<your-key>
Content-Type: application/json

{
  "name": "My AI System",
  "description": "What the system does",
  "purpose": "Business purpose and use case",
  "sector": "Healthcare",
  "usesPersonalData": true,
  "makesAutonomousDecisions": false,
  "affectsIndividuals": true,
  "currentSafeguards": "Human reviewer signs off on outputs; bias testing at deploy"
}`}</div>
          </div>

          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Response</div>
            <div className="font-mono text-xs bg-black/30 rounded p-3 whitespace-pre text-gray-300">{`{
  "risk_level": "HIGH_RISK",
  "compliance_score": 42,
  "risk_rationale": "Why this system is classified as such...",
  "regulatory_basis": "Annex III(1) biometrics, high-risk under Article 6(2) AI Act",
  "requirements": [...],
  "immediate_actions": [...],
  "estimated_effort": "120–180 hours"
}`}</div>
          </div>

          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Required fields</div>
            <ul className="space-y-1 text-gray-400">
              <li><span className="font-mono text-gray-200">name</span>: system name</li>
              <li><span className="font-mono text-gray-200">description</span>: what the system does</li>
              <li><span className="font-mono text-gray-200">purpose</span>: business purpose and use case</li>
              <li><span className="font-mono text-gray-200">sector</span>: industry sector</li>
            </ul>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-4 mb-2">Optional fields (improve classification accuracy)</div>
            <ul className="space-y-1 text-gray-400">
              <li><span className="font-mono text-gray-200">usesPersonalData</span>: boolean</li>
              <li><span className="font-mono text-gray-200">makesAutonomousDecisions</span>: boolean</li>
              <li><span className="font-mono text-gray-200">affectsIndividuals</span>: boolean</li>
              <li><span className="font-mono text-gray-200">currentSafeguards</span>: string describing human oversight, testing, etc.</li>
            </ul>
          </div>

          <div className="border-t border-white/10 pt-6">
            <h3 className="text-sm font-semibold text-white mb-4">Multi-entity (white-label / partner integrations)</h3>
            <div className="space-y-4">
              <div>
                <div className="font-mono text-xs bg-black/30 rounded px-3 py-2 mb-2 text-blue-400">
                  GET https://www.getactcomply.com/api/v1/orgs
                </div>
                <p className="text-gray-400">List the organisations your API key has access to (owner or active member). Use the returned <span className="font-mono">id</span> as the <span className="font-mono">org_id</span> parameter elsewhere.</p>
              </div>
              <div>
                <div className="font-mono text-xs bg-black/30 rounded px-3 py-2 mb-2 text-green-400">
                  POST https://www.getactcomply.com/api/v1/assess
                  <span className="text-gray-500"> + body field </span>
                  <span className="text-blue-400">&quot;org_id&quot;: &quot;...&quot;</span>
                </div>
                <p className="text-gray-400">Pass an <span className="font-mono">org_id</span> in the body to scope the new assessment to a specific client/workspace. Without it, the assessment lands in your personal workspace.</p>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6">
            <h3 className="text-sm font-semibold text-white mb-4">Read &amp; export</h3>
            <div className="space-y-4">
              <div>
                <div className="font-mono text-xs bg-black/30 rounded px-3 py-2 mb-2 text-blue-400">
                  GET https://www.getactcomply.com/api/v1/assessments
                </div>
                <p className="text-gray-400">List assessments. Query params: <span className="font-mono">org_id</span> (filter to org, or <span className="font-mono">personal</span> for personal workspace), <span className="font-mono">limit</span> (default 50, max 200), <span className="font-mono">offset</span>.</p>
              </div>
              <div>
                <div className="font-mono text-xs bg-black/30 rounded px-3 py-2 mb-2 text-blue-400">
                  GET https://www.getactcomply.com/api/v1/assessments/&#123;id&#125;
                </div>
                <p className="text-gray-400">Read one assessment plus every artefact bundled (technical doc, risk plan, logging spec, GDPR DPIA/FRIA, requirement progress, incidents).</p>
              </div>
              <div>
                <div className="font-mono text-xs bg-black/30 rounded px-3 py-2 mb-2 text-blue-400">
                  GET https://www.getactcomply.com/api/v1/orgs/&#123;orgId&#125;/export
                </div>
                <p className="text-gray-400">Single-archive JSON of every assessment + child artefact for one organisation. Used by white-label partners to hand a complete client compliance pack at engagement end.</p>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6">
            <h3 className="text-sm font-semibold text-white mb-4">Webhooks</h3>
            <p className="text-xs text-gray-400 mb-4">
              Subscribe to events and receive HTTP POST callbacks. Each delivery is signed with your endpoint
              secret using HMAC-SHA256 over the raw request body, in the <span className="font-mono">X-ActComply-Signature</span> header.
              Verify with constant-time comparison before trusting the payload.
            </p>
            <div className="space-y-4">
              <div>
                <div className="font-mono text-xs bg-black/30 rounded px-3 py-2 mb-2 text-blue-400">
                  GET https://www.getactcomply.com/api/v1/webhooks
                </div>
                <p className="text-gray-400">List your endpoints (with last 20 deliveries per endpoint when reading one by id).</p>
              </div>
              <div>
                <div className="font-mono text-xs bg-black/30 rounded px-3 py-2 mb-2 text-green-400">
                  POST https://www.getactcomply.com/api/v1/webhooks
                </div>
                <pre className="font-mono text-xs bg-black/30 rounded px-3 py-2 mb-2 text-gray-300 overflow-x-auto">{`{
  "url": "https://your-app.example/webhooks/actcomply",
  "enabled_events": ["assessment.created", "document.generated"],
  "description": "Production integration",
  "org_id": "1ec71...optional"
}`}</pre>
                <p className="text-gray-400">
                  Creates a subscription. The response includes a one-time <span className="font-mono">secret</span>: store it now, it&apos;s not retrievable later.
                  Omit <span className="font-mono">org_id</span> to receive events from every org you can access.
                </p>
              </div>
              <div>
                <div className="font-mono text-xs bg-black/30 rounded px-3 py-2 mb-2 text-blue-400">
                  GET https://www.getactcomply.com/api/v1/webhooks/&#123;id&#125;
                </div>
                <p className="text-gray-400">Read one endpoint plus its last 20 delivery attempts (status code, latency, attempt count).</p>
              </div>
              <div>
                <div className="font-mono text-xs bg-black/30 rounded px-3 py-2 mb-2 text-red-400">
                  DELETE https://www.getactcomply.com/api/v1/webhooks/&#123;id&#125;
                </div>
                <p className="text-gray-400">Remove a subscription. No further deliveries will be attempted.</p>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Supported events</div>
                <ul className="text-gray-400 space-y-1 list-disc pl-5">
                  <li><span className="font-mono text-blue-300">assessment.created</span>: a new risk assessment was saved (via dashboard or API)</li>
                  <li><span className="font-mono text-blue-300">document.generated</span>: a tech doc / DPIA-FRIA / risk plan / logging spec finished generating</li>
                  <li><span className="font-mono text-blue-300">alert.published</span>: a new regulatory alert was published platform-wide</li>
                  <li><span className="font-mono text-blue-300">incident.created</span>: a new Article 72/73 incident was logged</li>
                </ul>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Delivery + retries</div>
                <p className="text-gray-400">
                  Each event POSTs the JSON payload to your <span className="font-mono">url</span> with a 15-second timeout.
                  Non-2xx responses are recorded with their status code and the first 4KB of response body, retries are
                  not automatic in this beta; check the deliveries endpoint and replay manually if you need it.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Rate limits</div>
            <p className="text-gray-400">Enterprise plan: 100 requests/day per API key. Contact support for higher limits.</p>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-4 mb-2">CORS</div>
            <p className="text-gray-400">All <span className="font-mono">/api/v1/*</span> endpoints respond to OPTIONS preflight and set <span className="font-mono">Access-Control-Allow-Origin: *</span>. In-browser <span className="font-mono">fetch()</span> works from any origin as long as the request carries a valid bearer token.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
