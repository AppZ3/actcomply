'use client'

import { useState, useEffect, useCallback } from 'react'

interface ApiKey {
  id: string
  name: string
  key_prefix: string
  last_used_at: string | null
  created_at: string
}

interface CreatedKey extends ApiKey {
  raw_key: string
}

export function ApiKeyManager() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [createdKey, setCreatedKey] = useState<CreatedKey | null>(null)
  const [copied, setCopied] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/keys')
      if (res.ok) setKeys(await res.json())
    } catch {
      setError('Failed to load API keys.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function createKey() {
    if (!newName.trim()) return
    setCreating(true)
    setError('')
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to create key.'); return }
      setCreatedKey(data)
      setNewName('')
      setKeys(prev => [data, ...prev])
    } catch {
      setError('Failed to create API key.')
    } finally {
      setCreating(false)
    }
  }

  async function revokeKey(id: string) {
    try {
      await fetch(`/api/keys/${id}`, { method: 'DELETE' })
      setKeys(prev => prev.filter(k => k.id !== id))
      if (createdKey?.id === id) setCreatedKey(null)
    } catch {
      setError('Failed to revoke key.')
    }
  }

  async function copyKey(text: string) {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      {/* Create new key */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 className="font-semibold mb-4">API Keys</h2>

        {error && <p className="text-sm text-red-400 mb-3">{error}</p>}

        {createdKey && (
          <div className="mb-4 bg-green-500/10 border border-green-500/30 rounded-xl p-4">
            <p className="text-sm text-green-400 font-semibold mb-1">Key created — copy it now, it won&apos;t be shown again</p>
            <div className="flex items-center gap-2 mt-2">
              <code className="flex-1 text-xs font-mono bg-black/30 rounded px-3 py-2 text-gray-200 break-all">
                {createdKey.raw_key}
              </code>
              <button
                onClick={() => copyKey(createdKey.raw_key)}
                className="text-xs border border-white/10 px-3 py-2 rounded-lg hover:bg-white/5 transition flex-shrink-0"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && createKey()}
            placeholder="Key name (e.g. Production integration)"
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500/50"
          />
          <button
            onClick={createKey}
            disabled={creating || !newName.trim()}
            className="text-sm bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition"
          >
            {creating ? 'Creating…' : 'Create key'}
          </button>
        </div>
      </div>

      {/* Key list */}
      {loading ? (
        <p className="text-sm text-gray-500 px-1">Loading…</p>
      ) : keys.length === 0 ? (
        <p className="text-sm text-gray-500 px-1">No API keys yet.</p>
      ) : (
        <div className="space-y-2">
          {keys.map(k => (
            <div key={k.id} className="flex items-center justify-between gap-4 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{k.name}</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  <span className="font-mono">{k.key_prefix}…</span>
                  <span className="ml-3">Created {new Date(k.created_at).toLocaleDateString()}</span>
                  {k.last_used_at && (
                    <span className="ml-3">Last used {new Date(k.last_used_at).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => revokeKey(k.id)}
                className="text-xs text-red-400 hover:text-red-300 border border-red-500/30 px-3 py-1.5 rounded-lg transition flex-shrink-0"
              >
                Revoke
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
