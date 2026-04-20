import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold mb-4">You&apos;re subscribed!</h1>
        <p className="text-gray-300 mb-3">
          Welcome to ActComply. We&apos;ve sent a <span className="text-white font-medium">magic link to your email</span> — click it to access your compliance dashboard.
        </p>
        <p className="text-gray-500 text-sm mb-8">
          Don&apos;t see it? Check your spam folder. It comes from ActComply.
        </p>
        <div className="space-y-3">
          <Link
            href="/login"
            className="block bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3 rounded-xl transition"
          >
            Sign in to dashboard →
          </Link>
          <Link
            href="/assess"
            className="block border border-white/10 hover:border-white/20 text-gray-300 hover:text-white px-8 py-3 rounded-xl transition text-sm"
          >
            Run a free assessment while you wait
          </Link>
        </div>
      </div>
    </div>
  )
}
