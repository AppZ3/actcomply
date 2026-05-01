'use client'

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="text-xs text-blue-600 hover:text-blue-800 border border-blue-300 px-3 py-1 rounded transition"
    >
      Print / Save PDF
    </button>
  )
}
