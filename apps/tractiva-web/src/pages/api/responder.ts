import type { APIRoute } from 'astro'
import { Resend } from 'resend'
import { consumeRateLimit } from '../../lib/server/rate-limit'
import { requirePanelSession } from '../../lib/server/panel-auth'
import { getClientIp, rejectUntrustedOrigin } from '../../lib/server/security'

const FROM_EMAIL = 'Tractiva <hola@tractiva.cl>'
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const RATE_LIMIT_MAX = Number(import.meta.env.PANEL_RESPONDER_RATE_LIMIT_MAX || 20)
const RATE_LIMIT_WINDOW_SEC = Number(import.meta.env.PANEL_RESPONDER_RATE_LIMIT_WINDOW_SEC || 600)
const toSimpleHtml = (value: string) =>
  `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #111827; white-space: pre-wrap;">${value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')}</div>`

export const POST: APIRoute = async (context) => {
  try {
    const originError = rejectUntrustedOrigin(context)
    if (originError) return originError

    if (!(await requirePanelSession(context))) {
      return new Response(JSON.stringify({ error: 'No autenticado.' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0'
        }
      })
    }

    const { request } = context
    const rateKey = `panel-responder:${getClientIp(request)}`
    const limit = consumeRateLimit(rateKey, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_SEC * 1000)
    if (!limit.allowed) {
      return new Response(JSON.stringify({ error: 'Demasiados envíos. Intenta más tarde.' }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0',
          'Retry-After': String(limit.retryAfterSeconds)
        }
      })
    }

    const apiKey = import.meta.env.RESEND_API_KEY

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Servicio de correo no configurado.' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0'
        }
      })
    }
    const resend = new Resend(apiKey)

    let to = ''
    let subject = ''
    let body = ''
    let format: 'text' | 'html' = 'text'

    const contentType = request.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const payload = await request.json()
      to = payload?.to?.toString().trim() || ''
      subject = payload?.subject?.toString().trim() || ''
      format = payload?.format === 'html' ? 'html' : 'text'
      body = payload?.body?.toString() || payload?.html?.toString() || payload?.text?.toString() || ''
    } else {
      const formData = await request.formData()
      to = formData.get('to')?.toString().trim() || ''
      subject = formData.get('subject')?.toString().trim() || ''
      format = formData.get('format')?.toString() === 'html' ? 'html' : 'text'
      body = formData.get('body')?.toString() || formData.get('html')?.toString() || ''
    }
    body = body.trim()

    if (!to || !subject || !body) {
      return new Response(JSON.stringify({ error: 'Faltan campos requeridos.' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0'
        }
      })
    }

    if (!EMAIL_REGEX.test(to)) {
      return new Response(JSON.stringify({ error: 'El destinatario no es válido.' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0'
        }
      })
    }

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      ...(format === 'html' ? { html: body } : { text: body, html: toSimpleHtml(body) })
    })

    if (result.error) {
      console.error('Resend responder error:', result.error)
      return new Response(JSON.stringify({ error: 'No se pudo enviar el correo.' }), {
        status: 502,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0'
        }
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0'
      }
    })
  } catch (error) {
    console.error('Responder API error:', error)
    return new Response(JSON.stringify({ error: 'Error al enviar.' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0'
      }
    })
  }
}
