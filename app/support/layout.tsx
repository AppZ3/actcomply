import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Support — ActComply',
  description: 'Get in touch with ActComply for bug reports, EU AI Act questions, billing, or feature requests.',
  alternates: { canonical: 'https://www.getactcomply.com/support' },
}

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return children
}
