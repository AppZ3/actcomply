'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { AssessmentResult } from '@/lib/eu-ai-act'
import { createClient } from '@/lib/supabase'

const SECTORS = [
  'Technology / Software',
  'Financial Services / Banking',
  'Insurance',
  'Healthcare / Medical',
  'Education',
  'Human Resources / Recruitment',
  'Law Enforcement / Security',
  'Government / Public Sector',
  'Retail / E-commerce',
  'Manufacturing',
  'Transport / Logistics',
  'Energy / Utilities',
  'Media / Entertainment',
  'Other',
]

const RISK_CONFIG = {
  PROHIBITED: {
    label: 'PROHIBITED',
    color: 'text-red-400',
    bg: 'bg-red-500/10 border-red-500/20',
    badge: 'bg-red-500',
    description: 'This AI system is prohibited under EU AI Act Article 5. It cannot be deployed in the EU.',
  },
  HIGH_RISK: {
    label: 'HIGH RISK',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10 border-orange-500/20',
    badge: 'bg-orange-500',
    description: 'This AI system falls under Annex III high-risk categories and requires full compliance before deployment.',
  },
  LIMITED_RISK: {
    label: 'LIMITED RISK',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10 border-yellow-500/20',
    badge: 'bg-yellow-500',
    description: 'This AI system has transparency obligations. Users must be informed they are interacting with AI.',
  },
  MINIMAL_RISK: {
    label: 'MINIMAL RISK',
    color: 'text-green-400',
    bg: 'bg-green-500/10 border-green-500/20',
    badge: 'bg-green-500',
    description: 'This AI system has minimal obligations under the EU AI Act. No mandatory requirements apply.',
  },
}

const PLANS = [
  {
    key: 'starter',
    name: 'Starter',
    price: 499,
    annualPrice: 4990,
    description: 'For small teams getting compliant fast.',
    features: [
      'Up to 5 AI systems assessed',
      'Full EU AI Act risk classification',
      'Compliance requirement checklist',
      'Monthly regulatory update alerts',
      'PDF compliance report',
    ],
    highlight: false,
  },
  {
    key: 'business',
    name: 'Business',
    price: 1499,
    annualPrice: 14990,
    description: 'For teams with multiple AI systems.',
    features: [
      'Unlimited AI systems assessed',
      'Auto-generated technical documentation',
      'Conformity assessment templates',
      'Weekly regulatory monitoring alerts',
      'EU database registration guidance',
      'Audit trail for regulators',
      'Priority email support',
    ],
    highlight: true,
  },
  {
    key: 'enterprise',
    name: 'Enterprise',
    price: 2999,
    annualPrice: 29990,
    description: 'For large organisations and groups.',
    features: [
      'Everything in Business',
      'Multi-entity / group management',
      'White-label compliance reports',
      'API access to assessment engine',
      'Custom regulatory monitoring scope',
      'Dedicated onboarding support',
      'SLA-backed uptime',
    ],
    highlight: false,
  },
]

function UpgradePlans() {
  const [annual, setAnnual] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)

  async function handleCheckout(planKey: string) {
    setLoading(planKey)
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: planKey, annual }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else setLoading(null)
  }

  return (
    <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-8">
      <div className="text-center mb-8">
        <h2 className="text-xl font-bold mb-2">Get your full compliance package</h2>
        <p className="text-gray-400 text-sm mb-6">
          Auto-generated documentation, regulatory monitoring, and audit-ready reports — all included.
        </p>
        {/* Annual toggle */}
        <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-2">
          <span className={`text-sm ${!annual ? 'text-white' : 'text-gray-500'}`}>Monthly</span>
          <button
            onClick={() => setAnnual(v => !v)}
            className={`relative w-10 h-5 rounded-full transition-colors ${annual ? 'bg-blue-600' : 'bg-white/20'}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${annual ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
          <span className={`text-sm ${annual ? 'text-white' : 'text-gray-500'}`}>
            Annual <span className="text-green-400 text-xs font-semibold ml-1">2 months free</span>
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {PLANS.map(plan => (
          <div
            key={plan.key}
            className={`rounded-xl p-6 flex flex-col ${
              plan.highlight
                ? 'bg-blue-600/20 border-2 border-blue-500'
                : 'bg-white/5 border border-white/10'
            }`}
          >
            {plan.highlight && (
              <div className="text-xs font-semibold text-blue-400 uppercase tracking-wide mb-3">
                Most popular
              </div>
            )}
            <div className="mb-1 font-bold text-lg">{plan.name}</div>
            <div className="text-gray-400 text-xs mb-4">{plan.description}</div>
            <div className="mb-5">
              <span className="text-3xl font-bold">€{annual ? Math.round(plan.annualPrice / 12) : plan.price}</span>
              <span className="text-gray-400 text-sm">/month</span>
              {annual && (
                <div className="text-xs text-green-400 mt-0.5">€{plan.annualPrice}/year billed annually</div>
              )}
            </div>
            <ul className="space-y-2 mb-6 flex-1">
              {plan.features.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                  <svg className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleCheckout(plan.key)}
              disabled={loading === plan.key}
              className={`w-full py-2.5 rounded-lg text-sm font-semibold transition disabled:opacity-50 ${
                plan.highlight
                  ? 'bg-blue-600 hover:bg-blue-500 text-white'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              {loading === plan.key ? 'Loading...' : `Get ${plan.name} →`}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AssessPage() {
  const [step, setStep] = useState<'form' | 'loading' | 'result'>('form')
  const [result, setResult] = useState<AssessmentResult & { savedId?: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPaidUser, setIsPaidUser] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .single()
      if (profile && profile.plan !== 'free') setIsPaidUser(true)
    })
  }, [])

  const [form, setForm] = useState({
    name: '',
    description: '',
    purpose: '',
    sector: '',
    usesPersonalData: false,
    makesAutonomousDecisions: false,
    affectsIndividuals: false,
    currentSafeguards: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStep('loading')
    setError(null)

    try {
      const res = await fetch('/api/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Assessment failed')
      }

      setResult(data as AssessmentResult)
      setStep('result')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setStep('form')
    }
  }

  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-2">Analysing your AI system</h2>
          <p className="text-gray-400">Checking against EU AI Act regulations...</p>
        </div>
      </div>
    )
  }

  if (step === 'result' && result) {
    const config = RISK_CONFIG[result.riskLevel]
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <nav className="border-b border-white/10 px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-sm">AI</div>
              <span className="font-semibold text-lg">ActComply</span>
            </Link>
            <Link href="/assess" className="text-sm text-gray-400 hover:text-white transition">
              ← New assessment
            </Link>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto px-6 py-12">
          {/* Risk Level Banner */}
          <div className={`border rounded-2xl p-8 mb-8 ${config.bg}`}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className={`text-sm font-semibold mb-2 ${config.color}`}>RISK CLASSIFICATION</div>
                <h1 className={`text-4xl font-bold mb-3 ${config.color}`}>{config.label}</h1>
                <p className="text-gray-300 max-w-xl">{config.description}</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400 mb-1">Compliance Score</div>
                <div className={`text-5xl font-bold ${config.color}`}>{result.complianceScore}%</div>
                <div className="text-sm text-gray-400">currently in place</div>
              </div>
            </div>
          </div>

          {/* Rationale */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mb-6">
            <h2 className="text-lg font-semibold mb-3">Why this classification?</h2>
            <p className="text-gray-300 mb-4">{result.riskRationale}</p>
            <div className="text-sm text-blue-400 font-mono">{result.regulatoryBasis}</div>
          </div>

          {/* Prohibited reason */}
          {result.prohibitedReason && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 mb-6">
              <h2 className="text-lg font-semibold text-red-400 mb-3">Prohibition Basis</h2>
              <p className="text-gray-300">{result.prohibitedReason}</p>
            </div>
          )}

          {/* Immediate Actions */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mb-6">
            <h2 className="text-lg font-semibold mb-4">Immediate Actions Required</h2>
            <ol className="space-y-3">
              {result.immediateActions.map((action, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-gray-300">{action}</span>
                </li>
              ))}
            </ol>
            <div className="mt-6 pt-6 border-t border-white/10">
              <span className="text-sm text-gray-400">Estimated effort: </span>
              <span className="text-sm text-white font-medium">{result.estimatedEffort}</span>
            </div>
          </div>

          {/* Requirements */}
          {result.requirements.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mb-8">
              <h2 className="text-lg font-semibold mb-6">
                Full Compliance Requirements ({result.requirements.length})
              </h2>
              <div className="space-y-4">
                {result.requirements.map(req => (
                  <div key={req.id} className="border border-white/10 rounded-xl p-5">
                    <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
                      <div>
                        <span className="text-xs font-mono text-blue-400 mr-3">{req.article}</span>
                        <span className="font-semibold">{req.title}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                          req.effort === 'HIGH' ? 'bg-red-500/20 text-red-400' :
                          req.effort === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          {req.effort} EFFORT
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-400">{req.description}</p>
                    <p className="text-xs text-gray-500 mt-2">Deadline: {req.deadline}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          {isPaidUser ? (
            <div className="bg-green-600/10 border border-green-500/20 rounded-2xl p-8 text-center">
              <h2 className="text-xl font-bold mb-3">Assessment saved to your dashboard</h2>
              <p className="text-gray-400 mb-6">
                View this assessment alongside all your other AI systems, track compliance progress, and monitor for regulatory changes.
              </p>
              <Link
                href={result?.savedId ? `/dashboard/systems/${result.savedId}` : '/dashboard/systems'}
                className="inline-block bg-green-600 hover:bg-green-500 text-white font-semibold px-8 py-3 rounded-xl transition"
              >
                View in dashboard →
              </Link>
            </div>
          ) : (
            <UpgradePlans />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-white/10 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-sm">AI</div>
            <span className="font-semibold text-lg">ActComply</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-3">Free EU AI Act Assessment</h1>
          <p className="text-gray-400">
            Describe one of your AI systems below. We&apos;ll classify its risk level and show you exactly what compliance obligations apply.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4 mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              AI System Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Customer churn prediction model"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Describe what the AI system does technically — what inputs it takes, what outputs it produces, what model or approach it uses."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Purpose / Use Case <span className="text-red-400">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={form.purpose}
              onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))}
              placeholder="What business problem does it solve? Who uses it and how are its outputs acted upon?"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Industry Sector <span className="text-red-400">*</span>
            </label>
            <select
              required
              value={form.sector}
              onChange={e => setForm(f => ({ ...f, sector: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition"
            >
              <option value="" className="bg-gray-900">Select a sector</option>
              {SECTORS.map(s => (
                <option key={s} value={s} className="bg-gray-900">{s}</option>
              ))}
            </select>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
            <p className="text-sm font-medium text-gray-300">About this AI system:</p>
            {[
              { key: 'usesPersonalData', label: 'It processes personal data about individuals' },
              { key: 'makesAutonomousDecisions', label: 'It makes or significantly influences decisions autonomously' },
              { key: 'affectsIndividuals', label: 'Its outputs directly affect individuals (employment, credit, healthcare, etc.)' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form[key as keyof typeof form] as boolean}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500"
                />
                <span className="text-sm text-gray-300">{label}</span>
              </label>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Current safeguards in place <span className="text-gray-500">(optional)</span>
            </label>
            <textarea
              rows={2}
              value={form.currentSafeguards}
              onChange={e => setForm(f => ({ ...f, currentSafeguards: e.target.value }))}
              placeholder="e.g. Human review of all outputs, bias testing done, privacy impact assessment completed..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-4 rounded-xl text-lg transition"
          >
            Run compliance assessment →
          </button>

          <p className="text-xs text-gray-500 text-center">
            This assessment is for informational guidance only and does not constitute legal advice.
            Consult a qualified legal professional for binding compliance determinations.
          </p>
        </form>
      </div>
    </div>
  )
}
