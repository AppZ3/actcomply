'use client'

import { useState } from 'react'

const STEPS = [
  {
    num: 1,
    title: 'Confirm you are in scope',
    detail: 'Article 49 requires providers of high-risk AI systems to register before placing the system on the EU market or putting it into service. Deployers of certain high-risk AI systems (those listed in Annex III points 1–6) must also register.',
    article: 'Article 49(1)–(2)',
  },
  {
    num: 2,
    title: 'Prepare your registration information',
    detail: 'You will need: provider name and contact details, system name and version, intended purpose, risk classification and regulatory basis, summary of conformity assessment, list of Member States where the system is deployed, and the EU authorised representative (if you are a non-EU provider).',
    article: 'Article 49(3), Annex VIII',
  },
  {
    num: 3,
    title: 'Access the EU AI Act database',
    detail: 'The EU AI Office maintains the central registration database. Registration must be completed before the system is placed on the market. The database is publicly searchable — your registration number should appear on your technical documentation and EU Declaration of Conformity.',
    article: 'Article 71',
  },
  {
    num: 4,
    title: 'Obtain your registration number',
    detail: 'Upon successful registration you will receive a unique registration number. This number must be included in your EU Declaration of Conformity (Article 47) and referenced in your technical documentation. Keep the registration up to date when system details change.',
    article: 'Article 49(4)',
  },
  {
    num: 5,
    title: 'Maintain your registration',
    detail: 'Registration must be updated within 15 days whenever information changes materially — including new deployment contexts, version changes that affect risk classification, or changes to your authorised representative. Failure to maintain accurate registration is an independent compliance obligation.',
    article: 'Article 49(5)',
  },
]

interface Props {
  riskLevel: string
}

export function EUDatabaseGuidance({ riskLevel }: Props) {
  const [open, setOpen] = useState(false)
  const isHighRisk = riskLevel === 'HIGH_RISK'

  if (!isHighRisk) return null

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-white/5 transition"
      >
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h2 className="font-semibold">Article 49 — EU Database Registration</h2>
            <span className="text-xs font-mono bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-full">
              Required before market placement
            </span>
          </div>
          <p className="text-xs text-gray-500">Step-by-step registration guidance for the EU AI Act central database</p>
        </div>
        <svg
          className={`w-4 h-4 text-gray-500 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-white/10">
          <div className="px-6 py-4 bg-purple-500/5 border-b border-purple-500/10">
            <p className="text-xs text-purple-300/80">
              <span className="font-semibold text-purple-400">Article 49 obligation: </span>
              High-risk AI systems must be registered in the EU AI Act central database before being placed on the EU market. Registration is a prerequisite for CE marking and the EU Declaration of Conformity.
            </p>
          </div>

          <div className="divide-y divide-white/5">
            {STEPS.map(step => (
              <div key={step.num} className="px-6 py-4 flex gap-4">
                <div className="w-6 h-6 bg-purple-600/30 border border-purple-500/30 rounded-full flex items-center justify-center text-xs font-bold text-purple-400 shrink-0 mt-0.5">
                  {step.num}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-white">{step.title}</p>
                    <span className="text-xs font-mono text-purple-400 shrink-0">{step.article}</span>
                  </div>
                  <p className="text-sm text-gray-400">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="px-6 py-4 border-t border-white/10 bg-white/3">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs text-gray-500">
                Deadline: Before placing the system on the EU market · Deadline: 2 August 2026 for existing high-risk systems
              </p>
              <a
                href="https://ec.europa.eu/info/law/better-regulation/have-your-say/initiatives/14069-Artificial-intelligence-EU-database-for-high-risk-AI-systems_en"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-purple-400 hover:text-purple-300 border border-purple-500/30 hover:border-purple-400/50 px-3 py-1.5 rounded-lg transition shrink-0"
              >
                EU AI Act Database →
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
