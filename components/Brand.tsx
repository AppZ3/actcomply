import Link from 'next/link'

/**
 * The ActComply mark. Source of truth for the geometry is
 * public/actcomply-mark.svg, which is also what the favicon and the OG image
 * render.
 *
 * Two deliberate differences from the file in public/:
 *
 * 1. The accent strokes use the interface blue (blue-500) rather than the
 *    brand file's #3A6AA3. The two are close enough that showing both on one
 *    page reads as a mistake, and the interface blue is the one the whole site
 *    is already built on. public/ keeps the canonical colours for documents.
 * 2. The stroke is heavier than the 2.8 in the source file. At 32px a 2.8
 *    stroke renders under 1px and disappears next to the wordmark.
 */
export function BrandMark({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M 82 22 A 40 40 0 1 0 82 78"
        strokeWidth="5.5"
        strokeLinecap="round"
        className="stroke-gray-900 dark:stroke-white"
      />
      <path
        d="M 28 74 L 48 26 L 68 74"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-blue-500"
      />
      <line
        x1="35"
        y1="58"
        x2="61"
        y2="58"
        strokeWidth="5.5"
        strokeLinecap="round"
        className="stroke-blue-500"
      />
    </svg>
  )
}

interface BrandLockupProps {
  /** Wraps the lockup in a link. Pass null on the homepage, which is already there. */
  href?: string | null
  size?: number
  className?: string
}

/** Mark plus wordmark. The wordmark carries the accessible name, the mark is decorative. */
export function BrandLockup({ href = '/', size = 32, className = '' }: BrandLockupProps) {
  const inner = (
    <>
      <BrandMark size={size} />
      <span className="font-semibold text-lg">ActComply</span>
    </>
  )
  const cls = `flex items-center gap-2 ${className}`.trimEnd()

  return href === null
    ? <div className={cls}>{inner}</div>
    : <Link href={href} className={cls}>{inner}</Link>
}
