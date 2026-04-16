'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { PLANS } from '@/lib/stripe'

async function startCheckout(plan: string, annual: boolean) {
  const res = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan, annual }),
  })
  const data = await res.json()
  if (data.url) window.location.href = data.url
  else alert('Checkout error: ' + (data.error || 'Unknown error'))
}

export default function LandingPage() {
  const [annual, setAnnual] = useState(false)
  const [days, setDays] = useState<number | null>(null)
  const [requirementsMapped, setRequirementsMapped] = useState<number | null>(null)

  // If Supabase redirects back here with a ?code= param, forward to the auth callback
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code')
    if (code) {
      window.location.replace(`/auth/callback?code=${code}`)
    }
  }, [])

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/stats')
        const data = await res.json()
        setDays(data.daysUntilEnforcement)
        setRequirementsMapped(data.requirementsMapped)
      } catch {
        // fallback: calculate days client-side
        const deadline = new Date('2026-08-02T00:00:00Z')
        const diff = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        setDays(Math.max(0, diff))
      }
    }

    fetchStats()

    // Refresh every minute so days ticks down without a page reload
    const interval = setInterval(fetchStats, 60_000)
    return () => clearInterval(interval)
  }, [])
  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Nav */}
      <nav className="border-b border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-sm">AI</div>
            <span className="font-semibold text-lg">ActComply</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="#pricing" className="text-sm text-gray-400 hover:text-white transition">Pricing</Link>
            <Link href="/login" className="text-sm text-gray-400 hover:text-white transition">Sign in</Link>
            <Link href="/assess" className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-lg transition">
              Check Your AI Systems
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-28 text-center">
        <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-2 rounded-full mb-8">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          EU AI Act enforcement begins August 2, 2026
        </div>

        <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
          Is your AI compliant<br />
          <span className="text-blue-400">before the deadline?</span>
        </h1>

        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
          ActComply automatically assesses your AI systems against the EU AI Act,
          generates required documentation, and keeps you updated as regulations evolve.
          Non-compliance fines reach <span className="text-white font-semibold">€35M or 7% of global turnover.</span>
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/assess"
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-4 rounded-xl text-lg transition"
          >
            Assess your AI systems free →
          </Link>
          <Link
            href="#how-it-works"
            className="border border-white/20 hover:border-white/40 text-white font-semibold px-8 py-4 rounded-xl text-lg transition"
          >
            See how it works
          </Link>
        </div>

        <p className="text-sm text-gray-500 mt-4">No credit card required for free assessment</p>
      </section>

      {/* Stats */}
      <section className="border-y border-white/10 py-12">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '€35M', label: 'Maximum fine per violation' },
            { value: '7%', label: 'Of global turnover at risk' },
            {
              value: days !== null ? `${days} days` : '— days',
              label: 'Until enforcement begins',
              live: true,
            },
            {
              value: requirementsMapped !== null ? `${requirementsMapped}+` : '600+',
              label: 'Compliance requirements mapped',
              live: true,
            },
          ].map(stat => (
            <div key={stat.label}>
              <div className="text-3xl font-bold text-blue-400 mb-1 tabular-nums">
                {stat.value}
              </div>
              <div className="text-sm text-gray-400 flex items-center justify-center gap-1.5">
                {stat.live && days !== null && (
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shrink-0" />
                )}
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-6 py-24">
        <h2 className="text-3xl font-bold text-center mb-4">Compliance in three steps</h2>
        <p className="text-gray-400 text-center mb-16">No lawyers. No consultants. Automated, accurate, ongoing.</p>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: '01',
              title: 'Describe your AI systems',
              description: 'Tell us what your AI does, who it affects, and what sector it operates in. Takes under 5 minutes per system.',
            },
            {
              step: '02',
              title: 'Get instant risk classification',
              description: 'Our engine classifies each system under the EU AI Act — Prohibited, High-Risk, Limited Risk, or Minimal Risk — with exact article references.',
            },
            {
              step: '03',
              title: 'Receive your compliance roadmap',
              description: 'Get a prioritised action plan, auto-generated documentation templates, and ongoing alerts when regulations change.',
            },
          ].map(item => (
            <div key={item.step} className="bg-white/5 border border-white/10 rounded-2xl p-8">
              <div className="text-4xl font-bold text-blue-500/30 mb-4">{item.step}</div>
              <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
              <p className="text-gray-400">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 py-24">
        <h2 className="text-3xl font-bold text-center mb-4">Simple pricing</h2>
        <p className="text-gray-400 text-center mb-8">Cheaper than one hour of compliance consulting. Cancel anytime.</p>

        {/* Billing toggle */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          <span className={`text-sm ${!annual ? 'text-white' : 'text-gray-400'}`}>Monthly</span>
          <button
            onClick={() => setAnnual(v => !v)}
            className={`relative shrink-0 w-12 h-6 rounded-full transition-colors ${annual ? 'bg-blue-600' : 'bg-white/20'}`}
          >
            <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${annual ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
          <span className={`text-sm ${annual ? 'text-white' : 'text-gray-400'}`}>
            Annual <span className="text-green-400 font-semibold">2 months free</span>
          </span>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {Object.entries(PLANS).map(([key, plan], i) => {
            const displayPrice = annual ? plan.annualPrice : plan.price
            const perLabel = annual ? '/year' : '/mo'
            return (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 border ${
                  i === 1
                    ? 'bg-blue-600 border-blue-500'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                {i === 1 && (
                  <div className="text-xs font-semibold bg-white/20 text-white px-3 py-1 rounded-full inline-block mb-4">
                    MOST POPULAR
                  </div>
                )}
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="text-4xl font-bold mb-1">
                  €{displayPrice.toLocaleString()}
                  <span className="text-lg font-normal opacity-70">{perLabel}</span>
                </div>
                {annual && (
                  <p className={`text-xs mb-1 ${i === 1 ? 'text-blue-200' : 'text-green-400'}`}>
                    €{plan.price}/mo billed annually
                  </p>
                )}
                <p className={`text-sm mb-6 ${i === 1 ? 'text-blue-100' : 'text-gray-400'}`}>
                  {plan.limit === -1 ? 'Unlimited AI systems' : `Up to ${plan.limit} AI systems`}
                </p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <span className={i === 1 ? 'text-blue-200' : 'text-blue-400'}>✓</span>
                      <span className={i === 1 ? 'text-blue-50' : 'text-gray-300'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => startCheckout(key, annual)}
                  className={`w-full font-semibold py-3 rounded-xl transition cursor-pointer ${
                    i === 1
                      ? 'bg-white text-blue-600 hover:bg-blue-50'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  Get started
                </button>
                {i === 0 && (
                  <a
                    href="/test-buy"
                    className="block w-full text-center text-xs text-yellow-400 border border-yellow-500/30 hover:border-yellow-500/60 py-2 rounded-xl transition mt-2"
                  >
                    [TEST] Buy test price
                  </a>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-16 text-center">
        <div className="bg-blue-600/10 border border-blue-500/20 rounded-3xl p-16">
          <h2 className="text-3xl font-bold mb-4">Don&apos;t wait until August</h2>
          <p className="text-gray-400 max-w-xl mx-auto mb-8">
            High-risk AI systems require months of documentation work. Start your compliance assessment today — it takes 5 minutes.
          </p>
          <Link
            href="/assess"
            className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-semibold px-10 py-4 rounded-xl text-lg transition"
          >
            Start free assessment →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <div>© 2026 ActComply. Built to make AI trustworthy.</div>
          <div className="flex gap-6">
            <Link href="/support" className="hover:text-gray-300 transition">Support</Link>
            <Link href="/terms" className="hover:text-gray-300 transition">Terms</Link>
            <Link href="/privacy" className="hover:text-gray-300 transition">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
