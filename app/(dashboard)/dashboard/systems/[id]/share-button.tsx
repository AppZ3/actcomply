'use client'

import { useState } from 'react'

interface Props {
  assessmentId: string
}

export function ShareConformityButton({ assessmentId }: Props) {
  const [loading, setLoading] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [hasChecked, setHasChecked] = useState(false)
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function openPanel() {
    setOpen(true)
    if (hasChecked) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/share/conformity?assessmentId=${assessmentId}`)
      const data = await res.json()
      if (data?.token) {
        setShareUrl(`${window.location.origin}/share/conformity/${data.token}`)
      }
    } catch {
      // If check fails, user can still generate a new link
    } finally {
      setLoading(false)
      setHasChecked(true)
    }
  }

  async function generateLink() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/share/conformity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessmentId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create link')
      setShareUrl(`${window.location.origin}/share/conformity/${data.token}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create link')
    } finally {
      setLoading(false)
    }
  }

  async function revokeLink() {
    try {
      await fetch('/api/share/conformity', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessmentId }),
      })
      setShareUrl(null)
      setOpen(false)
    } catch {
      setError('Failed to revoke link')
    }
  }

  async function copyLink() {
    if (!shareUrl) return
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative">
      <button
        onClick={() => open ? setOpen(false) : openPanel()}
        className="text-sm text-gray-400 border border-white/10 hover:bg-white/5 px-4 py-2 rounded-lg transition"
      >
        Share Pack
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-gray-900 border border-white/15 rounded-xl shadow-xl z-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold">Shareable conformity pack</p>
            <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white text-xs">✕</button>
          </div>

          {loading && <p className="text-xs text-gray-400">Loading...</p>}
          {error && <p className="text-xs text-red-400 mb-2">{error}</p>}

          {!loading && shareUrl && (
            <>
              <p className="text-xs text-gray-400 mb-2">
                Anyone with this link can view the conformity pack, no login required.
              </p>
              <div className="flex gap-2 mb-3">
                <input
                  readOnly
                  value={shareUrl}
                  className="flex-1 text-xs bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-gray-300 font-mono truncate"
                />
                <button
                  onClick={copyLink}
                  className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg transition shrink-0"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 transition"
                >
                  Preview →
                </a>
                <div className="flex items-center gap-3">
                  <button
                    onClick={generateLink}
                    className="text-xs text-gray-500 hover:text-gray-300 transition"
                    title="Create a new link, this will invalidate the current one"
                  >
                    Regenerate
                  </button>
                  <button
                    onClick={revokeLink}
                    className="text-xs text-red-400 hover:text-red-300 transition"
                  >
                    Revoke
                  </button>
                </div>
              </div>
            </>
          )}

          {!loading && !shareUrl && (
            <>
              <p className="text-xs text-gray-400 mb-3">
                Generate a link to share this conformity pack with auditors, legal counsel, or regulators. No login required to view.
              </p>
              <button
                onClick={generateLink}
                className="w-full text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition"
              >
                Generate share link
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
