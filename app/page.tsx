import { LandingPage } from './landing'

// The hero counts down to the next compliance milestone, and that number is
// server-rendered so crawlers and no-JS visitors see the real figure rather
// than a placeholder. Static HTML would freeze it at build time, so the page
// regenerates hourly. The client still refreshes it from /api/stats on mount.
export const revalidate = 3600

export default function Page() {
  return <LandingPage />
}
