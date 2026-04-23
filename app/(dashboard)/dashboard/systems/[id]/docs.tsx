'use client'

import { useState, useEffect, useRef } from 'react'

const SECTIONS = [
  'General Description',
  'Intended Purpose and Deployment Context',
  'Development and Training Methodology',
  'Training Data and Data Governance',
  'Performance Metrics and Validation Testing',
  'Risk Management System',
  'Human Oversight Measures',
  'Transparency and Instructions for Use',
  'Cybersecurity and Robustness',
  'Post-Market Monitoring Plan',
]

function GeneratingProgress() {
  const [elapsed, setElapsed] = useState(0)
  const [activeSection, setActiveSection] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setElapsed(s => s + 1)
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  const allWritten = elapsed >= SECTIONS.length * 5

  useEffect(() => {
    setActiveSection(Math.min(Math.floor(elapsed / 5), SECTIONS.length - 1))
  }, [elapsed])

  return (
    <div className="mt-5 space-y-3">
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{allWritten ? 'Finalising and saving…' : 'Claude is writing your documentation…'}</span>
        <span className="font-mono tabular-nums">{elapsed}s</span>
      </div>
      <div className="space-y-1.5">
        {SECTIONS.map((name, i) => {
          const done = allWritten || i < activeSection
          const active = !allWritten && i === activeSection
          return (
            <div key={i} className="flex items-center gap-2.5">
              <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${
                done ? 'bg-green-500' : active ? 'bg-blue-500' : 'bg-white/10'
              }`}>
                {done && (
                  <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {active && (
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                )}
              </div>
              <span className={`text-xs transition-colors duration-300 ${
                done ? 'text-green-400' : active ? 'text-white' : 'text-gray-600'
              }`}>
                {name}
              </span>
            </div>
          )
        })}
      </div>
      {elapsed > 60 && !allWritten && (
        <p className="text-xs text-yellow-500/80 pt-1">
          Taking longer than usual — still working, don't close this tab.
        </p>
      )}
      {allWritten && (
        <p className="text-xs text-blue-400/80 pt-1 flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin inline-block" />
          All sections written — saving to your account…
        </p>
      )}
    </div>
  )
}

interface DocSection {
  id: string
  title: string
  article_ref: string
  content: string
}

interface TechnicalDoc {
  title: string
  generated_at: string
  risk_level: string
  regulatory_basis: string
  sections: DocSection[]
}

interface Props {
  assessmentId: string
  systemName: string
  isPaid: boolean
}

export function TechnicalDocumentation({ assessmentId, systemName, isPaid }: Props) {
  const [doc, setDoc] = useState<TechnicalDoc | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [expanded, setExpanded] = useState<string | null>('s1')

  useEffect(() => {
    fetch(`/api/docs/${assessmentId}`)
      .then(r => r.json())
      .then(d => { setDoc(d?.content ?? null); setLoading(false) })
  }, [assessmentId])

  async function generate() {
    setGenerating(true)
    const res = await fetch(`/api/docs/${assessmentId}`, { method: 'POST' })
    const data = await res.json()
    setDoc(data)
    setExpanded('s1')
    setGenerating(false)
  }

  if (!isPaid) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold mb-1">Article 11 Technical Documentation</h2>
            <p className="text-sm text-gray-400">Auto-generated audit-ready documentation covering all 10 Annex IV sections.</p>
          </div>
          <a
            href="/#pricing"
            className="shrink-0 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
          >
            Upgrade to generate →
          </a>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h2 className="font-semibold mb-2">Article 11 Technical Documentation</h2>
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!doc) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-semibold mb-1">Article 11 Technical Documentation</h2>
            <p className="text-sm text-gray-400 max-w-lg">
              Generate complete Annex IV technical documentation for this AI system — 10 sections covering development methodology, risk management, human oversight, and post-market monitoring. Audit-ready and regulator-facing.
            </p>
          </div>
          {generating && (
            <p className="text-xs text-gray-500 w-full mb-2">This takes ~30 seconds — please keep this tab open.</p>
          )}
          <button
            onClick={generate}
            disabled={generating}
            className="shrink-0 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition flex items-center gap-2"
          >
            {generating ? (
              <>
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating...
              </>
            ) : 'Generate documentation →'}
          </button>
        </div>
        {generating && (
          <div>
            <GeneratingProgress /></div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div>
          <h2 className="font-semibold">Article 11 Technical Documentation</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Generated {new Date(doc.generated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            {' · '}Annex IV compliant · {doc.sections.length} sections
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/dashboard/systems/${assessmentId}/print`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-white border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-lg transition"
          >
            Download PDF
          </a>
          <button
            onClick={generate}
            disabled={generating}
            className="text-xs text-gray-400 hover:text-white border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
          >
            {generating ? 'Regenerating...' : 'Regenerate'}
          </button>
        </div>
      </div>

      <div className="divide-y divide-white/5">
        {doc.sections.map(section => (
          <div key={section.id}>
            <button
              onClick={() => setExpanded(expanded === section.id ? null : section.id)}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/5 transition text-left"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">{section.title}</span>
                <span className="text-xs font-mono text-blue-400">{section.article_ref}</span>
              </div>
              <svg
                className={`w-4 h-4 text-gray-500 shrink-0 transition-transform ${expanded === section.id ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {expanded === section.id && (
              <div className="px-6 pb-5">
                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{section.content}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
