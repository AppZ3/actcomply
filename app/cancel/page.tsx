import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default function CancelPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <h1 className="text-2xl font-bold mb-4">Payment cancelled</h1>
        <p className="text-gray-400 mb-8">No charge was made. Come back when you&apos;re ready.</p>
        <Link
          href="/#pricing"
          className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3 rounded-xl transition"
        >
          View plans
        </Link>
      </div>
    </div>
  )
}
