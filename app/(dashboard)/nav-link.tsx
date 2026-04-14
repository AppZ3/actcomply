'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function NavLink({ href, label, icon, badge }: {
  href: string
  label: string
  icon: React.ReactNode
  badge?: number
}) {
  const pathname = usePathname()
  const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
        isActive
          ? 'bg-white/10 text-white font-medium'
          : 'text-gray-300 hover:text-white hover:bg-white/5'
      }`}
    >
      {icon}
      <span className="flex-1">{label}</span>
      {badge != null && badge > 0 && (
        <span className="bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </Link>
  )
}
