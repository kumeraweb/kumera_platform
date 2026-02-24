import type { APIRoute } from 'astro'
import { consumeRateLimit, resetRateLimit } from '../../../lib/server/rate-limit'
import { clearPanelSessionCookie, isPanelPasswordConfigured, isValidPanelPassword, setPanelSessionCookie } from '../../../lib/server/panel-auth'
import { getClientIp, rejectUntrustedOrigin } from '../../../lib/server/security'

const RATE_LIMIT_MAX = Number(import.meta.env.PANEL_LOGIN_RATE_LIMIT_MAX || 8)
const RATE_LIMIT_WINDOW_SEC = Number(import.meta.env.PANEL_LOGIN_RATE_LIMIT_WINDOW_SEC || 600)

const authErrorResponse = () =>
  new Response(JSON.stringify({ error: 'Contraseña inválida.' }), {
    status: 401,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, max-age=0'
    }
  })

export const POST: APIRoute = async (context) => {
  try {
    const originError = rejectUntrustedOrigin(context)
    if (originError) return originError

    if (!isPanelPasswordConfigured()) {
      return new Response(JSON.stringify({ error: 'Panel no configurado.' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0'
        }
      })
    }

    const { request, cookies } = context
    const ip = getClientIp(request)
    const rateKey = `panel-login:${ip}`

    const limit = consumeRateLimit(rateKey, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_SEC * 1000)
    if (!limit.allowed) {
      return new Response(JSON.stringify({ error: 'Demasiados intentos. Intenta más tarde.' }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0',
          'Retry-After': String(limit.retryAfterSeconds)
        }
      })
    }

    const contentType = request.headers.get('content-type') || ''
    let password = ''

    if (contentType.includes('application/json')) {
      const body = await request.json()
      password = body?.password?.toString() || ''
    } else {
      const formData = await request.formData()
      password = formData.get('password')?.toString() || ''
    }

    if (!password || !isValidPanelPassword(password)) {
      clearPanelSessionCookie(cookies)
      return authErrorResponse()
    }

    await setPanelSessionCookie(cookies)
    resetRateLimit(rateKey)

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0'
      }
    })
  } catch (error) {
    console.error('Panel login error:', error)
    return new Response(JSON.stringify({ error: 'No se pudo iniciar sesión.' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0'
      }
    })
  }
}
