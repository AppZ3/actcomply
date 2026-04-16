'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { PLANS } from '@/lib/stripe'
import { ThemeToggle } from '@/components/ThemeToggle'

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

  // Handle Supabase auth redirects that land on homepage
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code')
    if (code) {
      window.location.replace(`/auth/callback?code=${code}`)
      return
    }
    if (window.location.hash.includes('access_token=')) {
      window.location.replace(`/auth/callback${window.location.hash}`)
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
        const deadline = new Date('2026-08-02T00:00:00Z')
        const diff = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        setDays(Math.max(0, diff))
      }
    }
    fetchStats()
    const interval = setInterval(fetchStats, 60_000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-white">

      {/* Nav */}
      <nav className="border-b border-gray-200 dark:border-white/10 bg-white dark:bg-gray-950 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-sm text-white">AI</div>
            <span className="font-semibold text-lg">ActComply</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="#pricing" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition">Pricing</Link>
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition">Sign in</Link>
            <Link href="/assess" className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-3 py-1.5 rounded-lg transition">
              Check Your AI Systems
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-28 text-center">
        <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-sm px-4 py-2 rounded-full mb-8">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          EU AI Act enforcement begins August 2, 2026
        </div>

        <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
          Is your AI compliant<br />
          <span className="text-blue-500 dark:text-blue-400">before the deadline?</span>
        </h1>

        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10">
          ActComply automatically assesses your AI systems against the EU AI Act,
          generates required documentation, and keeps you updated as regulations evolve.
          Non-compliance fines reach <span className="text-gray-900 dark:text-white font-semibold">€35M or 7% of global turnover.</span>
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
            className="border border-gray-300 hover:border-gray-400 dark:border-white/20 dark:hover:border-white/40 text-gray-900 dark:text-white font-semibold px-8 py-4 rounded-xl text-lg transition"
          >
            See how it works
          </Link>
        </div>

        <p className="text-sm text-gray-500 mt-4">No credit card required for free assessment</p>
      </section>

      {/* Stats */}
      <section className="border-y border-gray-200 dark:border-white/10 py-12 bg-white dark:bg-transparent">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '€35M', label: 'Maximum fine per violation' },
            { value: '7%', label: 'Of global turnover at risk' },
            { value: days !== null ? `${days} days` : '— days', label: 'Until enforcement begins', live: true },
            { value: requirementsMapped !== null ? `${requirementsMapped}+` : '15+', label: 'Compliance requirements mapped', live: true },
          ].map(stat => (
            <div key={stat.label}>
              <div className="text-3xl font-bold text-blue-500 dark:text-blue-400 mb-1 tabular-nums">
                {stat.value}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1.5">
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
        <p className="text-gray-600 dark:text-gray-400 text-center mb-16">No lawyers. No consultants. Automated, accurate, ongoing.</p>
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
            <div key={item.step} className="bg-white border border-gray-200 dark:bg-white/5 dark:border-white/10 rounded-2xl p-8">
              <div className="text-4xl font-bold text-blue-500/20 dark:text-blue-500/30 mb-4">{item.step}</div>
              <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
              <p className="text-gray-600 dark:text-gray-400">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 py-24">
        <h2 className="text-3xl font-bold text-center mb-4">Simple pricing</h2>
        <p className="text-gray-600 dark:text-gray-400 text-center mb-8">Cheaper than one hour of compliance consulting. Cancel anytime.</p>

        {/* Billing toggle */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          <span className={`text-sm ${!annual ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>Monthly</span>
          <button
            onClick={() => setAnnual(v => !v)}
            className={`relative shrink-0 w-12 h-6 rounded-full transition-colors ${annual ? 'bg-blue-600' : 'bg-gray-300 dark:bg-white/20'}`}
          >
            <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${annual ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
          <span className={`text-sm ${annual ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
            Annual <span className="text-green-600 dark:text-green-400 font-semibold">2 months free</span>
          </span>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {Object.entries(PLANS).map(([key, plan], i) => {
            const displayPrice = annual ? plan.annualPrice : plan.price
            const perLabel = annual ? '/year' : '/mo'
            return (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 border flex flex-col ${
                  i === 1
                    ? 'bg-blue-600 border-blue-500'
                    : 'bg-white border-gray-200 dark:bg-white/5 dark:border-white/10'
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
                  <p className={`text-xs mb-1 ${i === 1 ? 'text-blue-200' : 'text-green-600 dark:text-green-400'}`}>
                    €{plan.price}/mo billed annually
                  </p>
                )}
                <p className={`text-sm mb-6 ${i === 1 ? 'text-blue-100' : 'text-gray-600 dark:text-gray-400'}`}>
                  {plan.limit === -1 ? 'Unlimited AI systems' : `Up to ${plan.limit} AI systems`}
                </p>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <span className={i === 1 ? 'text-blue-200' : 'text-blue-500 dark:text-blue-400'}>✓</span>
                      <span className={i === 1 ? 'text-blue-50' : 'text-gray-700 dark:text-gray-300'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => startCheckout(key, annual)}
                  className={`w-full font-semibold py-3 rounded-xl transition cursor-pointer mt-auto ${
                    i === 1
                      ? 'bg-white text-blue-600 hover:bg-blue-50'
                      : 'bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-gray-900 dark:text-white'
                  }`}
                >
                  Get started
                </button>
              </div>
            )
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-16 text-center">
        <div className="bg-blue-600/10 border border-blue-500/20 rounded-3xl p-16">
          <h2 className="text-3xl font-bold mb-4">Don&apos;t wait until August</h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto mb-8">
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
      <footer className="border-t border-gray-200 dark:border-white/10 px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <div>© 2026 ActComply. Built to make AI trustworthy.</div>
          <div className="flex gap-6">
            <Link href="/support" className="hover:text-gray-700 dark:hover:text-gray-300 transition">Support</Link>
            <Link href="/terms" className="hover:text-gray-700 dark:hover:text-gray-300 transition">Terms</Link>
            <Link href="/privacy" className="hover:text-gray-700 dark:hover:text-gray-300 transition">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
