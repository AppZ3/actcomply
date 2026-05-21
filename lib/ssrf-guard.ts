// SSRF guard for outbound webhook URLs.
//
// Validates: https-only, no embedded credentials, hostname is not a known
// internal name, and every IP the hostname resolves to falls outside private
// / link-local / loopback / cloud-metadata ranges.
//
// Called from POST /api/v1/webhooks at creation time and from deliverWebhook
// before each delivery. A small TOCTOU window remains between this resolve
// and the fetch's own resolve; defeating DNS rebinding fully would require
// pinning the fetch to a resolved IP via an undici dispatcher.

import { lookup } from 'node:dns/promises'
import net from 'node:net'

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'metadata',
  'metadata.google.internal',
  'metadata.goog',
])
const BLOCKED_HOSTNAME_SUFFIXES = ['.internal', '.local', '.localhost', '.intranet', '.lan']

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.').map(Number)
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n) || n < 0 || n > 255)) {
    return true
  }
  const [a, b] = parts
  if (a === 0) return true // 0.0.0.0/8
  if (a === 10) return true // 10.0.0.0/8
  if (a === 127) return true // 127.0.0.0/8 loopback
  if (a === 169 && b === 254) return true // 169.254.0.0/16 link-local + IMDS
  if (a === 172 && b >= 16 && b <= 31) return true // 172.16.0.0/12
  if (a === 192 && b === 0) return true // 192.0.0.0/24, 192.0.2.0/24
  if (a === 192 && b === 168) return true // 192.168.0.0/16
  if (a === 198 && (b === 18 || b === 19)) return true // 198.18.0.0/15 benchmark
  if (a === 198 && b === 51) return true // 198.51.100.0/24 TEST-NET-2
  if (a === 203 && b === 0) return true // 203.0.113.0/24 TEST-NET-3
  if (a >= 224) return true // multicast + reserved
  return false
}

function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase().split('%')[0] // strip zone id
  if (lower === '::1' || lower === '::') return true
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true // fc00::/7 ULA
  if (/^fe[89ab]/.test(lower)) return true // fe80::/10 link-local
  if (lower.startsWith('ff')) return true // ff00::/8 multicast
  if (lower.startsWith('::ffff:')) {
    const v4 = lower.slice('::ffff:'.length)
    if (net.isIPv4(v4)) return isPrivateIPv4(v4)
    return true
  }
  return false
}

export function isBlockedIp(ip: string): boolean {
  if (net.isIPv4(ip)) return isPrivateIPv4(ip)
  if (net.isIPv6(ip)) return isPrivateIPv6(ip)
  return true
}

export async function assertSafeWebhookUrl(rawUrl: string): Promise<URL> {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    throw new Error('Invalid URL')
  }
  if (url.protocol !== 'https:') {
    throw new Error('Only https URLs are allowed')
  }
  if (url.username || url.password) {
    throw new Error('URL must not contain credentials')
  }
  const host = url.hostname.toLowerCase()
  if (!host) throw new Error('URL must have a hostname')
  if (BLOCKED_HOSTNAMES.has(host)) {
    throw new Error('Hostname is not allowed')
  }
  for (const suffix of BLOCKED_HOSTNAME_SUFFIXES) {
    if (host.endsWith(suffix)) throw new Error('Hostname is not allowed')
  }

  // URL hostnames for IPv6 literals come back wrapped in brackets, e.g. "[::1]".
  const literal = host.startsWith('[') && host.endsWith(']') ? host.slice(1, -1) : host
  if (net.isIP(literal)) {
    if (isBlockedIp(literal)) throw new Error('URL resolves to a blocked address')
    return url
  }

  const addrs = await lookup(host, { all: true }).catch(() => [] as Array<{ address: string }>)
  if (addrs.length === 0) {
    throw new Error('Hostname did not resolve')
  }
  for (const a of addrs) {
    if (isBlockedIp(a.address)) {
      throw new Error('URL resolves to a blocked address')
    }
  }
  return url
}
