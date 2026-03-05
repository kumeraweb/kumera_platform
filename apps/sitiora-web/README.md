# sitiora-web

Landing comercial para venta de servicios de desarrollo web de Kumera (captacion de leads).

## Variables de entorno

- `RESEND_API_KEY`
- `PUBLIC_SITE_URL` (canonical/SEO base URL, e.g. `https://sitiora.cl`)
- `CONTACT_INBOX_EMAIL` (default: `contacto@kumeraweb.com`)
- `CONTACT_FROM_EMAIL` (default: `Sitiora Kumera <contacto@kumeraweb.com>`)
- `AUTOREPLY_FROM_EMAIL` (default: `Sitiora Kumera <noreply@kumeraweb.com>`)
- `CONTACT_REPLY_TO_EMAIL` (default: `contacto@kumeraweb.com`)
- `ALLOWED_ORIGINS`
- `CONTACT_RATE_LIMIT_MAX` (default: `6`)
- `CONTACT_RATE_LIMIT_WINDOW_SEC` (default: `600`)

## Flujo comercial

1. Sitio captura lead por formulario o WhatsApp.
2. Lead llega al inbox comercial.
3. Cierre se negocia manualmente.
4. Activacion se formaliza via `kumera-admin` -> billing (`sitiora`).
