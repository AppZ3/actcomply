'use client'

export function ManageBillingButton() {
  async function handleClick() {
    const res = await fetch('/api/billing/portal', { method: 'POST' })
    const data = await res.json()
    if (data.url) window.location.href = data.url
  }

  return (
    <button
      onClick={handleClick}
      className="text-sm text-gray-300 hover:text-white border border-white/10 hover:border-white/20 px-4 py-2 rounded-lg transition"
    >
      Manage billing & invoices →
    </button>
  )
}
