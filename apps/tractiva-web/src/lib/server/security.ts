import type { APIContext } from 'astro'

export const getClientIp = (request: Request) => {
  const xff = request.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0]?.trim() || 'unknown'
  return request.headers.get('x-real-ip') || 'unknown'
}

const normalizeOrigin = (value: string) => {
  try {
    return new URL(value).origin.toLowerCase()
  } catch {
    return null
  }
}

const parseAllowedOriginsFromEnv = () =>
  (import.meta.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin: string) => normalizeOrigin(origin.trim()))
    .filter((origin: string | null): origin is string => Boolean(origin))

export const getTrustedOrigins = (request: Request) => {
  const trusted = new Set<string>(parseAllowedOriginsFromEnv())

  if (import.meta.env.VERCEL_URL) {
    const vercelOrigin = normalizeOrigin(`https://${import.meta.env.VERCEL_URL}`)
    if (vercelOrigin) trusted.add(vercelOrigin)
  }

  const host = request.headers.get('x-forwarded-host') || request.headers.get('host')
  const proto = request.headers.get('x-forwarded-proto') || new URL(request.url).protocol.replace(':', '')
  if (host && proto) {
    const hostOnly = host.split(':')[0].toLowerCase()
    const origin = normalizeOrigin(`${proto}://${hostOnly}`)
    if (origin) trusted.add(origin)

    // Trust apex and www variants of the same host to avoid false negatives.
    const alternateHost = hostOnly.startsWith('www.') ? hostOnly.slice(4) : `www.${hostOnly}`
    const alternateOrigin = normalizeOrigin(`${proto}://${alternateHost}`)
    if (alternateOrigin) trusted.add(alternateOrigin)
  }

  return trusted
}

export const isTrustedOriginRequest = (request: Request) => {
  const trusted = getTrustedOrigins(request)

  const originHeader = request.headers.get('origin')
  const origin = originHeader ? normalizeOrigin(originHeader) : null
  if (origin && trusted.has(origin)) return true

  const refererHeader = request.headers.get('referer')
  const referer = refererHeader ? normalizeOrigin(refererHeader) : null
  if (referer && trusted.has(referer)) return true

  return false
}

export const rejectUntrustedOrigin = (context: APIContext) => {
  if (isTrustedOriginRequest(context.request)) return null
  return new Response(JSON.stringify({ error: 'Origen no permitido.' }), {
    status: 403,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, max-age=0'
    }
  })
}
