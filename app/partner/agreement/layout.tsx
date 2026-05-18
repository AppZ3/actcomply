import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Partner Referral Agreement — ActComply',
  description: 'ActComply partner program referral agreement.',
  robots: { index: false, follow: false },
  alternates: { canonical: 'https://www.getactcomply.com/partner/agreement' },
}

export default function PartnerAgreementLayout({ children }: { children: React.ReactNode }) {
  return children
}
