import type { Metadata } from 'next'
import { computeRisk, type Sector, type ScreenerAnswers } from '@/lib/screener'

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams
  const sector = typeof params.sector === 'string' ? params.sector : 'AI'
  const tier = params.tier === 'high' ? 'High Risk' : 'Limited Risk'
  return {
    title: `EU AI Act Risk Result: ${tier} for ${sector}`,
    description: `This ${sector} AI system has been classified as ${tier} under the EU AI Act. See the key compliance obligations.`,
  }
}

export default async function ResultPage({ searchParams }: Props) {
  const params = await searchParams
  const sector = (typeof params.sector === 'string' ? params.sector : 'Other') as Sector
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.getactcomply.com'

  const risk = computeRisk({
    sector,
    decisions_people: params.tier === 'high' ? true : false,
    people_per_month: '1000-100000',
    eu_jurisdiction: 'EU-based',
    deployment_stage: 'Live',
    compliance_work_done: 'Nothing',
  } as ScreenerAnswers)

  const tierLabel = risk.tier === 'high' ? 'High Risk' : 'Limited Risk'
  const badgeClass = risk.tier === 'high'
    ? 'bg-red-100 text-red-800'
    : 'bg-yellow-100 text-yellow-800'

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="text-center mb-6">
          <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${badgeClass} mb-3`}>
            {tierLabel}
          </span>
          <h1 className="text-2xl font-bold text-slate-900">EU AI Act Risk Assessment Result</h1>
          {risk.annex_iii_category && (
            <p className="text-sm text-slate-500 mt-2">{risk.annex_iii_category}</p>
          )}
        </div>
        <p className="text-sm text-slate-600 mb-6">{risk.urgency_note}</p>
        <ul className="space-y-3 mb-8">
          {risk.obligations.map((o, i) => (
            <li key={i} className="flex gap-3 text-sm text-slate-700">
              <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-semibold">{i + 1}</span>
              <span>{o}</span>
            </li>
          ))}
        </ul>
        <p className="text-sm text-slate-500 mb-6 italic">Shared result. Take the full 7-question assessment for a personalised report.</p>
        <a
          href={`${APP_URL}/check`}
          className="block w-full bg-slate-900 text-white text-center py-3 rounded-xl font-semibold hover:bg-slate-800 transition-colors"
        >
          Get your full compliance roadmap. Free trial, no card required.
        </a>
      </div>
    </div>
  )
}
