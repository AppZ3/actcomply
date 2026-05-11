'use client'

import { useState } from 'react'

const STEPS = [
  {
    num: 1,
    title: 'Determine if you are a non-EU provider',
    detail: 'Article 22 applies if your organisation is established outside the EU but places AI systems on the EU market or puts them into service in the EU (Article 2(1)(c)). If you are EU-established, you do not need an authorised representative, but you must still meet all provider obligations directly.',
    article: 'Article 22(1)',
  },
  {
    num: 2,
    title: 'Appoint an EU-established authorised representative',
    detail: 'The representative must be established in one of the EU Member States where your system is placed on the market. They must be given written mandate to act on your behalf. They become the point of contact for national market-surveillance authorities and the EU AI Office.',
    article: 'Article 22(1)–(2)',
  },
  {
    num: 3,
    title: 'Define the mandate scope',
    detail: 'The mandate must include: authority to register the system in the EU database (Article 49), authority to cooperate with market-surveillance authorities, and authority to report serious incidents (Article 73). The mandate must be documented and producible on request.',
    article: 'Article 22(3)',
  },
  {
    num: 4,
    title: 'Include representative details in technical documentation',
    detail: 'Your EU Declaration of Conformity (Article 47) and Instructions for Use (Article 13) must identify your authorised representative by name, address, and contact details. The representative\'s details must also appear in EU database registration.',
    article: 'Articles 13, 47, 49',
  },
  {
    num: 5,
    title: 'Maintain shared liability understanding',
    detail: 'The authorised representative acts on your behalf but you remain the provider responsible for compliance. If the representative cannot locate you or you have ceased to operate, MSAs may take enforcement action against the representative directly. Ensure your representative agreement addresses this risk.',
    article: 'Article 22(4)',
  },
]

interface Props {
  riskLevel: string
}

export function Article22Guidance({ riskLevel }: Props) {
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
            <h2 className="font-semibold">Article 22, EU Authorised Representative</h2>
            <span className="text-xs font-mono bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full">
              Non-EU providers only
            </span>
          </div>
          <p className="text-xs text-gray-500">Required if you are placing AI on the EU market from outside the EU</p>
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
          <div className="px-6 py-4 bg-yellow-500/5 border-b border-yellow-500/10">
            <p className="text-xs text-yellow-300/80">
              <span className="font-semibold text-yellow-400">Article 22 obligation: </span>
              Non-EU providers placing high-risk AI on the EU market must appoint an EU-based authorised representative before market placement. This is a common compliance gap for startups and scale-ups outside the EU serving EU customers.
            </p>
          </div>

          <div className="divide-y divide-white/5">
            {STEPS.map(step => (
              <div key={step.num} className="px-6 py-4 flex gap-4">
                <div className="w-6 h-6 bg-yellow-600/20 border border-yellow-500/30 rounded-full flex items-center justify-center text-xs font-bold text-yellow-400 shrink-0 mt-0.5">
                  {step.num}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-white">{step.title}</p>
                    <span className="text-xs font-mono text-yellow-400 shrink-0">{step.article}</span>
                  </div>
                  <p className="text-sm text-gray-400">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="px-6 py-4 border-t border-white/10">
            <p className="text-xs text-gray-500">
              Deadline: Must be appointed before the system is placed on the EU market. No grace period applies. Failure to appoint is an independent violation subject to fines up to €15M or 3% of global turnover (Article 99(3)).
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
