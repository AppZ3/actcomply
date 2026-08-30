import Link from 'next/link'

export interface FooterLink {
  href: string
  label: string
}

type FooterWidth = '4xl' | '6xl'
type FooterSpacing = 'none' | 'sm' | 'lg'

// Written out rather than interpolated so Tailwind's scanner sees the literals.
const WIDTHS: Record<FooterWidth, string> = {
  '4xl': 'max-w-4xl',
  '6xl': 'max-w-6xl',
}

const SPACING: Record<FooterSpacing, string> = {
  none: '',
  sm: 'mt-8',
  lg: 'mt-16',
}

interface SiteFooterProps {
  /** Match the content column of the page above. */
  width?: FooterWidth
  /** Gap above the footer. 'none' for pages whose last section already ends flush. */
  spacing?: FooterSpacing
  /** Left-hand text. Omit for the pages that only carry a link row. */
  tagline?: string
  links: FooterLink[]
  /** The FRIA template is a print target and drops its footer on paper. */
  printHidden?: boolean
}

/**
 * The public site footer.
 *
 * Links and tagline stay per-page, because they genuinely differ: the guide
 * pages cross-link to their siblings, the homepage surfaces the SEO pages, and
 * the legal pages carry a short row. What is now shared is the chrome, which
 * had drifted into three treatments (gray-500 vs gray-400 text, three hover
 * colours, mt-8 vs mt-16). terms and privacy also had a dark-only hover, so
 * their links did not respond to the cursor in light mode at all.
 */
export function SiteFooter({
  width = '4xl',
  spacing = 'lg',
  tagline,
  links,
  printHidden = false,
}: SiteFooterProps) {
  return (
    <footer
      className={`border-t border-gray-200 dark:border-white/10 py-8 ${SPACING[spacing]} ${
        printHidden ? 'print:hidden' : ''
      }`}
    >
      <div
        className={`${WIDTHS[width]} mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500 dark:text-gray-400`}
      >
        {tagline ? <span>{tagline}</span> : null}
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
          {links.map(link => (
            <Link
              key={link.href + link.label}
              href={link.href}
              className="hover:text-gray-700 dark:hover:text-gray-300 transition"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  )
}
