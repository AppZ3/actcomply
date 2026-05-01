'use client'

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="text-sm border border-white/20 hover:bg-white/5 px-4 py-2 rounded-lg transition"
    >
      Print / Save PDF
    </button>
  )
}
