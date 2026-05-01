'use client'

export function DpaPrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="text-sm text-gray-400 border border-white/10 hover:bg-white/5 px-4 py-2 rounded-lg transition flex-shrink-0"
    >
      Print / Save PDF
    </button>
  )
}
