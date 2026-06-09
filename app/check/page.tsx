import type { Metadata } from 'next'
import ScreenerWizard from './ScreenerWizard'

export const metadata: Metadata = {
  title: 'Free EU AI Act Risk Assessment: 5 Minutes, No Signup',
  description: 'Find out if your AI system is high-risk under the EU AI Act. Free classifier, instant result, no account required.',
  openGraph: {
    title: 'Free EU AI Act Risk Assessment',
    description: 'Is your AI product high-risk under the EU Act? 7 questions. Instant result. No signup.',
    url: 'https://www.getactcomply.com/check',
  },
}

export default function CheckPage() {
  return <ScreenerWizard />
}
