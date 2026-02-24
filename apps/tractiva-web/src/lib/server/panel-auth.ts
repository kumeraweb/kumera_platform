import type { APIContext, AstroCookies } from 'astro'

const SESSION_COOKIE_NAME = 'panel_session'
const SESSION_TTL_SEC = 60 * 60 * 12

const encoder = new TextEncoder()
const decoder = new TextDecoder()

const getPanelPassword = () => (import.meta.env.PANEL_PASSWORD || '').toString()

const toBase64Url = (input: string) => {
  const bytes = encoder.encode(input)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

const fromBase64Url = (input: string) => {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '==='.slice((normalized.length + 3) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return decoder.decode(bytes)
}

const toBase64UrlBytes = (bytes: Uint8Array) => {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

const sign = async (payloadBase64: string, secret: string) => {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(payloadBase64))
  return toBase64UrlBytes(new Uint8Array(signatureBuffer))
}

const timingSafeMatch = (a: string, b: string) => {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

const createSessionToken = async (secret: string) => {
  const nowSec = Math.floor(Date.now() / 1000)
  const payload = {
    iat: nowSec,
    exp: nowSec + SESSION_TTL_SEC,
    role: 'panel'
  }
  const payloadBase64 = toBase64Url(JSON.stringify(payload))
  const signature = await sign(payloadBase64, secret)
  return `${payloadBase64}.${signature}`
}

const verifySessionToken = async (token: string, secret: string) => {
  const parts = token.split('.')
  if (parts.length !== 2) return false

  const [payloadBase64, signature] = parts
  const expected = await sign(payloadBase64, secret)
  if (!timingSafeMatch(signature, expected)) return false

  try {
    const payloadText = fromBase64Url(payloadBase64)
    const payload = JSON.parse(payloadText)
    const exp = Number(payload?.exp || 0)
    return Number.isFinite(exp) && exp > Math.floor(Date.now() / 1000)
  } catch {
    return false
  }
}

export const isPanelPasswordConfigured = () => Boolean(getPanelPassword())

export const isValidPanelPassword = (input: string) => {
  const expected = getPanelPassword()
  if (!expected) return false
  return timingSafeMatch(input, expected)
}

export const setPanelSessionCookie = async (cookies: AstroCookies) => {
  const secret = getPanelPassword()
  const token = await createSessionToken(secret)

  cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_TTL_SEC
  })
}

export const clearPanelSessionCookie = (cookies: AstroCookies) => {
  cookies.delete(SESSION_COOKIE_NAME, { path: '/' })
}

export const requirePanelSession = async (context: APIContext) => {
  const secret = getPanelPassword()
  if (!secret) return false

  const token = context.cookies.get(SESSION_COOKIE_NAME)?.value || ''
  if (!token) return false

  return verifySessionToken(token, secret)
}
