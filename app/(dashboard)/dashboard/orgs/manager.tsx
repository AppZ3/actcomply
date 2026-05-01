'use client'

import { useState, useEffect, useCallback } from 'react'

interface Member {
  id: string
  email: string
  role: string
  status: string
  invited_at: string
}

interface Org {
  id: string
  name: string
  owner_id: string
  created_at: string
  org_members: Member[]
}

const ROLE_COLORS: Record<string, string> = {
  admin: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  member: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  viewer: 'text-gray-400 bg-gray-500/10 border-gray-500/30',
}

export function OrgManager({ userId }: { userId: string }) {
  const [orgs, setOrgs] = useState<Org[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newOrgName, setNewOrgName] = useState('')
  const [creating, setCreating] = useState(false)
  const [expandedOrg, setExpandedOrg] = useState<string | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'viewer'>('member')
  const [inviting, setInviting] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/orgs')
      if (res.ok) setOrgs(await res.json())
    } catch {
      setError('Failed to load organisations.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function createOrg() {
    if (!newOrgName.trim()) return
    setCreating(true)
    setError('')
    try {
      const res = await fetch('/api/orgs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newOrgName.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to create organisation.'); return }
      setOrgs(prev => [{ ...data, org_members: [] }, ...prev])
      setNewOrgName('')
      setExpandedOrg(data.id)
    } catch {
      setError('Failed to create organisation.')
    } finally {
      setCreating(false)
    }
  }

  async function inviteMember(orgId: string) {
    if (!inviteEmail.trim()) return
    setInviting(orgId)
    setError('')
    try {
      const res = await fetch(`/api/orgs/${orgId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to invite member.'); return }
      setOrgs(prev => prev.map(o =>
        o.id === orgId ? { ...o, org_members: [...o.org_members, data] } : o
      ))
      setInviteEmail('')
    } catch {
      setError('Failed to invite member.')
    } finally {
      setInviting(null)
    }
  }

  async function removeMember(orgId: string, memberId: string) {
    try {
      await fetch(`/api/orgs/${orgId}/members/${memberId}`, { method: 'DELETE' })
      setOrgs(prev => prev.map(o =>
        o.id === orgId ? { ...o, org_members: o.org_members.filter(m => m.id !== memberId) } : o
      ))
    } catch {
      setError('Failed to remove member.')
    }
  }

  return (
    <div className="space-y-4">
      {/* Create org */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 className="font-semibold mb-4">Organisations</h2>
        {error && <p className="text-sm text-red-400 mb-3">{error}</p>}
        <div className="flex gap-2">
          <input
            type="text"
            value={newOrgName}
            onChange={e => setNewOrgName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && createOrg()}
            placeholder="Organisation name (e.g. Acme Corp EU)"
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500/50"
          />
          <button
            onClick={createOrg}
            disabled={creating || !newOrgName.trim()}
            className="text-sm bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition"
          >
            {creating ? 'Creating…' : 'Create'}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500 px-1">Loading…</p>
      ) : orgs.length === 0 ? (
        <p className="text-sm text-gray-500 px-1">No organisations yet. Create one above.</p>
      ) : (
        <div className="space-y-3">
          {orgs.map(org => (
            <div key={org.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <button
                onClick={() => setExpandedOrg(expandedOrg === org.id ? null : org.id)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/5 transition text-left"
              >
                <div>
                  <div className="font-medium">{org.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {org.org_members.length} member{org.org_members.length !== 1 ? 's' : ''}
                    {org.owner_id === userId && <span className="ml-2 text-blue-400">Owner</span>}
                    · Created {new Date(org.created_at).toLocaleDateString()}
                  </div>
                </div>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${expandedOrg === org.id ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {expandedOrg === org.id && (
                <div className="px-6 pb-6 border-t border-white/10 pt-4 space-y-4">
                  {/* Invite form */}
                  {org.owner_id === userId && (
                    <div>
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Invite member</div>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          value={inviteEmail}
                          onChange={e => setInviteEmail(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && inviteMember(org.id)}
                          placeholder="Email address"
                          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500/50"
                        />
                        <select
                          value={inviteRole}
                          onChange={e => setInviteRole(e.target.value as typeof inviteRole)}
                          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none"
                        >
                          <option value="viewer">Viewer</option>
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button
                          onClick={() => inviteMember(org.id)}
                          disabled={inviting === org.id || !inviteEmail.trim()}
                          className="text-sm border border-white/10 hover:bg-white/5 disabled:opacity-50 px-4 py-2 rounded-lg transition"
                        >
                          {inviting === org.id ? 'Inviting…' : 'Invite'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Member list */}
                  {org.org_members.length === 0 ? (
                    <p className="text-sm text-gray-500">No members yet.</p>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Members</div>
                      {org.org_members.map(m => (
                        <div key={m.id} className="flex items-center justify-between gap-3 bg-black/20 rounded-xl px-4 py-2.5">
                          <div className="min-w-0">
                            <div className="text-sm truncate">{m.email}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`text-xs border px-1.5 py-0.5 rounded ${ROLE_COLORS[m.role] ?? ''}`}>
                                {m.role}
                              </span>
                              {m.status === 'pending' && (
                                <span className="text-xs text-yellow-400">pending</span>
                              )}
                            </div>
                          </div>
                          {org.owner_id === userId && (
                            <button
                              onClick={() => removeMember(org.id, m.id)}
                              className="text-xs text-red-400 hover:text-red-300 border border-red-500/30 px-2.5 py-1 rounded-lg transition flex-shrink-0"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
