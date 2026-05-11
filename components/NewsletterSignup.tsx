'use client'

import { useState } from 'react'

type Variant = 'inline' | 'card'

export function NewsletterSignup({
  source = 'site',
  variant = 'card',
  heading,
  subheading,
}: {
  source?: string
  variant?: Variant
  heading?: string
  subheading?: string
}) {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || submitting) return
    setSubmitting(true)
    try {
      await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), source }),
      })
      setDone(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div
        className={
          variant === 'card'
            ? 'rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-sm text-emerald-100'
            : 'text-sm text-emerald-300'
        }
      >
        <strong>You're in.</strong> Check your inbox, a welcome note is on its way. Reply any time, your replies go straight to me.
      </div>
    )
  }

  const card = variant === 'card'

  return (
    <form
      onSubmit={onSubmit}
      className={
        card
          ? 'rounded-xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm'
          : ''
      }
    >
      {card && heading && (
        <h3 className="text-lg font-semibold text-white mb-1">{heading}</h3>
      )}
      {card && subheading && (
        <p className="text-sm text-slate-400 mb-4 leading-relaxed">{subheading}</p>
      )}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          required
          inputMode="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 min-w-0 rounded-lg bg-slate-950/60 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 focus:bg-slate-950/80 transition"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-blue-700/50 px-5 py-2.5 text-sm font-semibold text-white transition whitespace-nowrap"
        >
          {submitting ? 'Subscribing…' : 'Subscribe'}
        </button>
      </div>
      <p className="text-xs text-slate-500 mt-3 leading-relaxed">
        One email when there's something worth saying. Unsubscribe in one click.
      </p>
    </form>
  )
}
