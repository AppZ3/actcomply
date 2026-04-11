import Link from 'next/link'

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <div className="w-20 h-20 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">✓</span>
        </div>
        <h1 className="text-3xl font-bold mb-4">You&apos;re subscribed!</h1>
        <p className="text-gray-400 mb-8">
          Welcome to ActComply. Your account is active and your AI systems are now being monitored for EU AI Act compliance.
        </p>
        <Link
          href="/assess"
          className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3 rounded-xl transition"
        >
          Start assessing your AI systems →
        </Link>
      </div>
    </div>
  )
}
