import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Regulatory Alerts',
  description: 'EU AI Act updates, enforcement milestones, and regulatory alerts for your compliance team.',
}

export default function AlertsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
