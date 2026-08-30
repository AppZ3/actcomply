import type { ReactNode } from 'react'
import { BrandLockup } from './Brand'

type NavWidth = '2xl' | '4xl' | '6xl'

// Written out rather than interpolated so Tailwind's scanner sees the literals.
const WIDTHS: Record<NavWidth, string> = {
  '2xl': 'max-w-2xl',
  '4xl': 'max-w-4xl',
  '6xl': 'max-w-6xl',
}

interface SiteNavProps {
  /** Match the content column of the page underneath. */
  width?: NavWidth
  /** Pass null on the homepage so the lockup is not a link to itself. */
  brandHref?: string | null
  /** terms and privacy sit on the page background rather than a solid bar. */
  transparentDark?: boolean
  /** Right-hand actions, laid out in a gap-4 row. */
  children?: ReactNode
}

/**
 * The public site header. Before this existed the same markup was pasted into
 * sixteen page files, which is why the nav went on rendering a placeholder
 * logo long after the real mark landed in public/.
 */
export function SiteNav({
  width = '4xl',
  brandHref = '/',
  transparentDark = false,
  children,
}: SiteNavProps) {
  return (
    <nav
      className={`border-b border-gray-200 dark:border-white/10 bg-white ${
        transparentDark ? 'dark:bg-transparent' : 'dark:bg-gray-950'
      } px-6 py-4`}
    >
      <div className={`${WIDTHS[width]} mx-auto flex items-center justify-between`}>
        <BrandLockup href={brandHref} />
        {children ? <div className="flex items-center gap-4">{children}</div> : null}
      </div>
    </nav>
  )
}
