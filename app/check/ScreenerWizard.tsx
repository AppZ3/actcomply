'use client'

import { useState } from 'react'
import type { ScreenerAnswers, ScreenerResult } from '@/lib/screener'

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7

interface ApiResult extends ScreenerResult {
  clause_paragraph: string
  lead_id: string
}

interface WizardState {
  step: Step
  answers: Partial<ScreenerAnswers> & { email?: string; consent?: boolean; _hp?: string }
  result: ApiResult | null
  loading: boolean
  error: string | null
  submitted: boolean
}

const SECTORS = ['Healthcare', 'Finance', 'HR & Recruitment', 'Critical Infrastructure', 'Education', 'Other'] as const
const PEOPLE_OPTIONS = ['<1,000', '1,000–100,000', '>100,000'] as const
const PEOPLE_VALUES = ['<1000', '1000-100000', '>100000'] as const

export default function ScreenerWizard() {
  const [state, setState] = useState<WizardState>({
    step: 1,
    answers: {},
    result: null,
    loading: false,
    error: null,
    submitted: false,
  })

  function set(field: string, value: unknown) {
    setState(s => ({ ...s, answers: { ...s.answers, [field]: value } }))
  }

  function next() {
    setState(s => ({ ...s, step: Math.min(s.step + 1, 7) as Step }))
  }

  function back() {
    setState(s => ({ ...s, step: Math.max(s.step - 1, 1) as Step }))
  }

  async function submit() {
    setState(s => ({ ...s, loading: true, error: null }))
    try {
      const res = await fetch('/api/screener', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...state.answers,
          _hp: '',  // honeypot — must be empty
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      setState(s => ({ ...s, result: data, loading: false, submitted: true }))
    } catch (e) {
      setState(s => ({ ...s, loading: false, error: (e as Error).message }))
    }
  }

  function shareResult() {
    if (!state.result) return
    const url = `${window.location.origin}/check/result?tier=${state.result.tier}&sector=${encodeURIComponent(state.answers.sector ?? '')}`
    navigator.clipboard.writeText(url)
  }

  const progress = state.submitted ? 100 : Math.round((state.step / 7) * 100)

  // Tier badge styling
  const tierBadge = state.result?.tier === 'high'
    ? 'bg-red-100 text-red-800 border-red-200'
    : 'bg-yellow-100 text-yellow-800 border-yellow-200'

  const tierLabel = state.result?.tier === 'high' ? 'High Risk' : 'Limited Risk'

  if (state.submitted && state.result) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="text-center mb-6">
            <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold border ${tierBadge} mb-3`}>
              {tierLabel}
            </span>
            <h1 className="text-2xl font-bold text-slate-900">Your EU AI Act Risk Assessment</h1>
            {state.result.annex_iii_category && (
              <p className="text-sm text-slate-500 mt-2">{state.result.annex_iii_category}</p>
            )}
          </div>

          <div className="mb-6">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">Top 3 Compliance Obligations</h2>
            <ul className="space-y-3">
              {state.result.obligations.map((o, i) => (
                <li key={i} className="flex gap-3 text-sm text-slate-700">
                  <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-semibold">{i + 1}</span>
                  <span>{o}</span>
                </li>
              ))}
            </ul>
          </div>

          {state.result.clause_paragraph && (
            <div className="bg-slate-50 rounded-xl p-4 mb-6 text-sm text-slate-700 leading-relaxed">
              {state.result.clause_paragraph}
            </div>
          )}

          <p className="text-sm text-slate-600 mb-6">{state.result.urgency_note}</p>

          <a
            href={`/signup?email=${encodeURIComponent(state.answers.email ?? '')}&sector=${encodeURIComponent(state.answers.sector ?? '')}&risk=${state.result.tier}`}
            className="block w-full bg-slate-900 text-white text-center py-3 rounded-xl font-semibold hover:bg-slate-800 transition-colors mb-3"
          >
            Get your full compliance roadmap — free trial, no card required
          </a>

          <button
            onClick={shareResult}
            className="block w-full text-center py-3 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Copy shareable result link
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-slate-400 mb-2">
            <span>EU AI Act Risk Assessment</span>
            <span>Step {state.step} of 7</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full">
            <div className="h-1.5 bg-slate-900 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Step 1: Sector */}
        {state.step === 1 && (
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">What sector is your organisation in?</h2>
            <p className="text-sm text-slate-500 mb-6">We use this to identify which Annex III categories apply to your AI system.</p>
            <div className="grid grid-cols-2 gap-3">
              {SECTORS.map(s => (
                <button
                  key={s}
                  onClick={() => { set('sector', s); next() }}
                  className={`py-3 px-4 rounded-xl border text-sm font-medium text-left transition-colors ${
                    state.answers.sector === s
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'border-slate-200 text-slate-700 hover:border-slate-400'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Decisions affecting people */}
        {state.step === 2 && (
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Does your AI system make or influence decisions affecting individual people?</h2>
            <p className="text-sm text-slate-500 mb-6">Examples: approving loans, screening CVs, triaging patients, setting insurance premiums.</p>
            <div className="space-y-3">
              {[
                { label: 'Yes', value: true },
                { label: 'No', value: false },
                { label: 'Not sure', value: null },
              ].map(opt => (
                <button
                  key={opt.label}
                  onClick={() => { set('decisions_people', opt.value); next() }}
                  className="w-full py-3 px-4 rounded-xl border border-slate-200 text-sm font-medium text-left text-slate-700 hover:border-slate-400 transition-colors"
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button onClick={back} className="mt-4 text-sm text-slate-400 hover:text-slate-600">Back</button>
          </div>
        )}

        {/* Step 3: Scale */}
        {state.step === 3 && (
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">How many people does it affect per month?</h2>
            <p className="text-sm text-slate-500 mb-6">Approximate is fine — we use this to assess proportionality obligations.</p>
            <div className="space-y-3">
              {PEOPLE_OPTIONS.map((label, i) => (
                <button
                  key={label}
                  onClick={() => { set('people_per_month', PEOPLE_VALUES[i]); next() }}
                  className="w-full py-3 px-4 rounded-xl border border-slate-200 text-sm font-medium text-left text-slate-700 hover:border-slate-400 transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
            <button onClick={back} className="mt-4 text-sm text-slate-400 hover:text-slate-600">Back</button>
          </div>
        )}

        {/* Step 4: EU Jurisdiction */}
        {state.step === 4 && (
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Is your company based in the EU, or do you serve EU customers?</h2>
            <div className="space-y-3">
              {[
                { label: 'EU-based', value: 'EU-based' },
                { label: 'Not EU-based, but we serve EU customers', value: 'Non-EU serves EU' },
                { label: 'Both — EU company serving EU customers', value: 'Both' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { set('eu_jurisdiction', opt.value); next() }}
                  className="w-full py-3 px-4 rounded-xl border border-slate-200 text-sm font-medium text-left text-slate-700 hover:border-slate-400 transition-colors"
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button onClick={back} className="mt-4 text-sm text-slate-400 hover:text-slate-600">Back</button>
          </div>
        )}

        {/* Step 5: Deployment */}
        {state.step === 5 && (
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Is this system already deployed, or still in development?</h2>
            <div className="space-y-3">
              {[
                { label: 'Already live / deployed', value: 'Live' },
                { label: 'Still in development', value: 'In development' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { set('deployment_stage', opt.value); next() }}
                  className="w-full py-3 px-4 rounded-xl border border-slate-200 text-sm font-medium text-left text-slate-700 hover:border-slate-400 transition-colors"
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button onClick={back} className="mt-4 text-sm text-slate-400 hover:text-slate-600">Back</button>
          </div>
        )}

        {/* Step 6: Compliance work done */}
        {state.step === 6 && (
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Have you done any EU AI Act compliance work yet?</h2>
            <div className="space-y-3">
              {[
                'Nothing',
                'Some internal review',
                'Formal assessment started',
              ].map(opt => (
                <button
                  key={opt}
                  onClick={() => { set('compliance_work_done', opt); next() }}
                  className="w-full py-3 px-4 rounded-xl border border-slate-200 text-sm font-medium text-left text-slate-700 hover:border-slate-400 transition-colors"
                >
                  {opt}
                </button>
              ))}
            </div>
            <button onClick={back} className="mt-4 text-sm text-slate-400 hover:text-slate-600">Back</button>
          </div>
        )}

        {/* Step 7: Email + consent */}
        {state.step === 7 && (
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Get your full risk report</h2>
            <p className="text-sm text-slate-500 mb-6">Optional — your results are shown regardless. Enter your email to receive a written summary and compliance checklist.</p>

            {/* Honeypot — hidden from humans, not display:none (bots fill display:none too) */}
            <input
              name="_hp"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px' }}
              onChange={e => set('_hp', e.target.value)}
            />

            <div className="space-y-4">
              <input
                type="email"
                placeholder="you@company.com (optional)"
                value={state.answers.email ?? ''}
                onChange={e => set('email', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              {state.answers.email && (
                <label className="flex items-start gap-3 text-sm text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={state.answers.consent ?? false}
                    onChange={e => set('consent', e.target.checked)}
                    className="mt-0.5 rounded"
                  />
                  <span>I agree to receive EU AI Act compliance updates from ActComply. Unsubscribe anytime.</span>
                </label>
              )}
            </div>

            {state.error && <p className="mt-3 text-sm text-red-600">{state.error}</p>}

            <button
              onClick={submit}
              disabled={state.loading}
              className="mt-6 w-full bg-slate-900 text-white py-3 rounded-xl font-semibold hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              {state.loading ? 'Calculating...' : 'See my risk assessment'}
            </button>
            <button onClick={back} className="mt-4 text-sm text-slate-400 hover:text-slate-600 block">Back</button>
          </div>
        )}
      </div>
    </div>
  )
}
