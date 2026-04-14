'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'actcomply_onboarded'

export function OnboardingBanner({ userEmail }: { userEmail: string }) {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true)
  }, [])

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  const steps = [
    {
      icon: (
        <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0">AI</div>
      ),
      title: `Welcome to ActComply`,
      body: `You're signed in as ${userEmail}. ActComply helps you comply with the EU AI Act before the August 2026 enforcement deadline — avoiding fines of up to €35M.`,
      cta: null,
      ctaLabel: null,
    },
    {
      icon: (
        <div className="w-10 h-10 bg-orange-500/20 border border-orange-500/30 rounded-xl flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
      ),
      title: 'Step 1 — Assess your AI systems',
      body: 'Describe each AI system your business uses. Claude classifies its risk level, cites the exact EU AI Act articles, and gives you a compliance action plan in under 30 seconds.',
      cta: '/assess',
      ctaLabel: 'Run your first assessment →',
    },
    {
      icon: (
        <div className="w-10 h-10 bg-green-500/20 border border-green-500/30 rounded-xl flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      ),
      title: 'Step 2 — Track and document compliance',
      body: 'For each system, mark requirements as in-progress or done, generate Article 11 technical documentation, and download a full PDF compliance report for regulators.',
      cta: null,
      ctaLabel: null,
    },
  ]

  const current = steps[step]

  return (
    <div className="bg-blue-600/10 border border-blue-500/20 rounded-xl p-5 mb-8">
      <div className="flex items-start gap-4">
        {current.icon}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm mb-1">{current.title}</h3>
          <p className="text-gray-400 text-sm leading-relaxed">{current.body}</p>
          <div className="flex items-center gap-3 mt-4">
            {current.cta ? (
              <Link
                href={current.cta}
                className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
              >
                {current.ctaLabel}
              </Link>
            ) : step < steps.length - 1 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={dismiss}
                className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
              >
                Got it, let&apos;s go →
              </button>
            )}
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)} className="text-sm text-gray-500 hover:text-gray-300 transition">
                ← Back
              </button>
            )}
            <button onClick={dismiss} className="text-sm text-gray-600 hover:text-gray-400 transition ml-auto">
              Dismiss
            </button>
          </div>
        </div>
        {/* Step dots */}
        <div className="flex gap-1.5 shrink-0 mt-1">
          {steps.map((_, i) => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === step ? 'bg-blue-400' : 'bg-white/20'}`} />
          ))}
        </div>
      </div>
    </div>
  )
}
