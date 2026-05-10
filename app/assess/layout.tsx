import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Assess Your AI System',
  description: 'Describe your AI system and get an instant EU AI Act risk classification, compliance score, and action plan.',
  alternates: { canonical: 'https://www.getactcomply.com/assess' },
}

export default function AssessLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
