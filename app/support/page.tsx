'use client'

import { useState } from 'react'
import Link from 'next/link'

const SUBJECTS = [
  'I have a bug or technical issue',
  'I have a question about the EU AI Act',
  'I have a question about my plan or billing',
  'I have a feature suggestion',
  'Something else',
]

export default function SupportPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (res.ok) {
      setDone(true)
    } else {
      setError('Something went wrong — please try again or email support@getactcomply.com directly.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <nav className="border-b border-white/10 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-500 rounded-md flex items-center justify-center font-bold text-xs">A</div>
            <span className="font-semibold text-sm">ActComply</span>
          </Link>
          <Link href="/login" className="text-sm text-gray-400 hover:text-white transition">
            Sign in
          </Link>
        </div>
      </nav>

      <div className="max-w-xl mx-auto px-6 py-16">
        {done ? (
          <div className="text-center">
            <div className="w-12 h-12 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-3">Message received</h1>
            <p className="text-gray-400 text-sm leading-relaxed">
              We'll get back to you within 24 hours. If your issue is urgent, email us directly at{' '}
              <a href="mailto:support@getactcomply.com" className="text-blue-400 hover:underline">
                support@getactcomply.com
              </a>
              .
            </p>
            <Link
              href="/"
              className="inline-block mt-8 text-sm text-gray-400 hover:text-white transition"
            >
              ← Back to ActComply
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-bold mb-2">Contact support</h1>
              <p className="text-gray-400 text-sm">
                Questions, bugs, or ideas — we read everything and reply fast.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Your name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Sarah Johnson"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Email *</label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="you@company.com"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5">What's this about?</label>
                <select
                  value={form.subject}
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select a topic</option>
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Message *</label>
                <textarea
                  required
                  rows={5}
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="Describe your issue or question in as much detail as you can..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              {error && (
                <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-3 rounded-lg text-sm transition"
              >
                {loading ? 'Sending...' : 'Send message →'}
              </button>

              <p className="text-center text-xs text-gray-600">
                Or email us directly at{' '}
                <a href="mailto:support@getactcomply.com" className="text-gray-500 hover:text-gray-300 transition">
                  support@getactcomply.com
                </a>
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
