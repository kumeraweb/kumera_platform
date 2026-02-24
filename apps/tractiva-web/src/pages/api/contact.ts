import type { APIRoute } from 'astro'
import { Resend } from 'resend'
import { consumeRateLimit } from '../../lib/server/rate-limit'
import { getClientIp, rejectUntrustedOrigin } from '../../lib/server/security'

const FROM_EMAIL = 'Tractiva <hola@tractiva.cl>'
const INBOX_EMAIL = 'hola@tractiva.cl'
const LOGO_URL = 'https://tractiva.cl/tractiva.png'
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const CONTACT_RATE_LIMIT_MAX = Number(import.meta.env.CONTACT_RATE_LIMIT_MAX || 6)
const CONTACT_RATE_LIMIT_WINDOW_SEC = Number(import.meta.env.CONTACT_RATE_LIMIT_WINDOW_SEC || 600)

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

export const POST: APIRoute = async (context) => {
  try {
    const originError = rejectUntrustedOrigin(context)
    if (originError) return originError

    const { request } = context
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

    const formData = await request.formData()

    const nombre = formData.get('nombre')?.toString() || ''
    const email = formData.get('email')?.toString().trim().toLowerCase() || ''
    const mensaje = formData.get('mensaje')?.toString() || ''

    const rateKey = `contact:${getClientIp(request)}:${email}`
    const limit = consumeRateLimit(rateKey, CONTACT_RATE_LIMIT_MAX, CONTACT_RATE_LIMIT_WINDOW_SEC * 1000)
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

    if (!nombre || !email || !EMAIL_REGEX.test(email)) {
      return new Response(JSON.stringify({ error: 'Nombre y email son requeridos.' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0'
        }
      })
    }

    const safeNombre = escapeHtml(nombre.slice(0, 120))
    const safeEmail = escapeHtml(email.slice(0, 160))
    const safeMensaje = escapeHtml(mensaje.slice(0, 4000))

    // 1) Email interno
    const internalEmailResult = await resend.emails.send({
      from: FROM_EMAIL,
      to: INBOX_EMAIL,
      replyTo: email,
      subject: `Nuevo contacto — ${nombre}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 24px; max-width: 560px; color: #0f172a;">
          <h2 style="font-size: 20px; margin: 0 0 16px;">Nuevo contacto desde tractiva.cl</h2>
          <table style="font-size: 15px; color: #334155; line-height: 1.6; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 12px 6px 0; font-weight: 600;">Nombre</td>
              <td>${safeNombre}</td>
            </tr>
            <tr>
              <td style="padding: 6px 12px 6px 0; font-weight: 600;">Email</td>
              <td>${safeEmail}</td>
            </tr>
            ${
              mensaje
                ? `
            <tr>
              <td style="padding: 6px 12px 6px 0; font-weight: 600; vertical-align: top;">Mensaje</td>
              <td>${safeMensaje}</td>
            </tr>`
                : ''
            }
          </table>
        </div>
      `
    })

    if (internalEmailResult.error) {
      console.error('Resend internal error:', internalEmailResult.error)
      return new Response(JSON.stringify({ error: 'No se pudo enviar el correo interno.' }), {
        status: 502,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0'
        }
      })
    }

    // 2) Auto-reply al usuario
    const autoReplyResult = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      replyTo: INBOX_EMAIL,
      subject: 'Recibimos tu mensaje',
      text: `Hola ${nombre},

Recibimos tu mensaje correctamente.
Te responderemos dentro de las próximas 24 horas.

Si prefieres, también puedes escribirnos por WhatsApp:
https://wa.me/56987435207

Tractiva`,
      headers: {
        'Auto-Submitted': 'auto-replied',
        'X-Auto-Response-Suppress': 'All'
      },
      attachments: [
        {
          filename: 'tractiva.png',
          path: LOGO_URL,
          contentId: 'tractiva-logo'
        }
      ],
      html: `
        <style>
          @media (prefers-color-scheme: dark) {
            .email-wrap {
              background: #0b1220 !important;
            }
            .email-card {
              background: #111827 !important;
              border-color: #1f2937 !important;
            }
            .email-title {
              color: #f8fafc !important;
            }
            .email-body {
              color: #cbd5e1 !important;
            }
            .email-divider {
              border-top-color: #1f2937 !important;
            }
            .email-footer {
              color: #94a3b8 !important;
            }
            .logo-dark-invert {
              filter: brightness(0) invert(1) !important;
            }
          }
        </style>
        <div class="email-wrap" style="background: #f8fafc; padding: 32px 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0f172a;">
          <div class="email-card" style="max-width: 540px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
            <div style="margin: 0 0 20px;">
              <img
                class="logo-dark-invert"
                src="cid:tractiva-logo"
                alt="Tractiva"
                width="164"
                style="display: block; width: 164px; max-width: 100%; height: auto;"
              />
            </div>
            <h2 class="email-title" style="font-size: 22px; margin: 0 0 12px;">Hola ${safeNombre}</h2>
            <p class="email-body" style="font-size: 15px; line-height: 1.7; color: #334155; margin: 0 0 18px;">
              Tu mensaje llegó correctamente. Te responderemos dentro de las próximas <strong>24 horas</strong>.
            </p>
            <a
              href="https://wa.me/56987435207"
              style="display: inline-block; padding: 11px 18px; background: #16a34a; color: #ffffff; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;"
            >
              Escribir por WhatsApp
            </a>
            <hr class="email-divider" style="margin: 24px 0; border: 0; border-top: 1px solid #e2e8f0;" />
            <p class="email-footer" style="font-size: 13px; color: #64748b; margin: 0; line-height: 1.6;">
              Tractiva — Google Ads para profesionales en Chile<br />
              © ${new Date().getFullYear()} Tractiva
            </p>
          </div>
        </div>
      `
    })

    if (autoReplyResult.error) {
      console.error('Resend autoreply error:', autoReplyResult.error)
      return new Response(
        JSON.stringify({ error: 'Mensaje recibido, pero la confirmación falló.' }),
        {
          status: 502,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, max-age=0'
          }
        }
      )
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0'
      }
    })
  } catch (error) {
    console.error('Error enviando correo:', error)
    return new Response(JSON.stringify({ error: 'Error al enviar.' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0'
      }
    })
  }
}
