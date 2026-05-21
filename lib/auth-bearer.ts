import { timingSafeEqual } from 'node:crypto'

// Constant-time bearer-token check that fails closed when the expected
// secret is missing. Replaces direct string compares of
// `auth === \`Bearer ${process.env.X}\`` which (a) leak timing information
// byte-by-byte and (b) silently authenticate a literal "Bearer undefined"
// header when the env var is unset.
export function bearerOk(header: string | null | undefined, expected: string | undefined | null): boolean {
  if (!expected) return false
  if (!header || !header.startsWith('Bearer ')) return false
  const supplied = Buffer.from(header.slice('Bearer '.length), 'utf8')
  const want = Buffer.from(expected, 'utf8')
  if (supplied.length !== want.length) return false
  try {
    return timingSafeEqual(supplied, want)
  } catch {
    return false
  }
}
