'use client'

import { useEffect, useState, useTransition } from 'react'
import type { OrgSummary } from '@/lib/active-org'

interface Props {
  orgs: OrgSummary[]
  activeOrgId: string | null
  setActiveOrg: (formData: FormData) => Promise<void>
}

const PERSONAL_VALUE = '__personal__'

export function OrgSwitcher({ orgs, activeOrgId, setActiveOrg }: Props) {
  // Controlled, uncontrolled selects keep stale visual state after Server
  // Action revalidations. Sync to the server-rendered activeOrgId on every
  // prop change.
  const [value, setValue] = useState<string>(activeOrgId ?? PERSONAL_VALUE)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setValue(activeOrgId ?? PERSONAL_VALUE)
  }, [activeOrgId])

  if (orgs.length === 0) return null

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.currentTarget.value
    setValue(next)
    const fd = new FormData()
    fd.set('orgId', next)
    startTransition(() => {
      setActiveOrg(fd)
    })
  }

  return (
    <div className="px-3 py-3 border-b border-white/10">
      <label htmlFor="active-org" className="block text-xs text-gray-500 uppercase tracking-wide mb-1.5 px-1">
        Workspace
      </label>
      <select
        id="active-org"
        value={value}
        onChange={onChange}
        disabled={isPending}
        className="w-full bg-white/5 border border-white/10 hover:border-white/20 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500/50 transition cursor-pointer disabled:opacity-60"
      >
        <option value={PERSONAL_VALUE} className="bg-gray-900">Personal workspace</option>
        {orgs.map(o => (
          <option key={o.id} value={o.id} className="bg-gray-900">{o.name}</option>
        ))}
      </select>
      {isPending && (
        <p className="text-xs text-gray-500 px-1 mt-1.5">Switching…</p>
      )}
    </div>
  )
}
