# Kumera Web - Env Contract

Last updated: 2026-03-05

App: `apps/kumera-web`

## 1) Variables confirmadas en Vercel (pasada actual)

Estas variables fueron reportadas como cargadas y estan en uso real en codigo:

1. `RESEND_API_KEY`
   - Uso: envio de correo interno + auto-reply en formulario de contacto
2. `CONTACT_INBOX_EMAIL`
   - Uso: inbox comercial destino de leads
3. `CONTACT_FROM_EMAIL`
   - Uso: remitente de correo interno
4. `AUTOREPLY_FROM_EMAIL`
   - Uso: remitente de auto-reply
5. `CONTACT_REPLY_TO_EMAIL`
   - Uso: reply-to de auto-reply
6. `CONTACT_RATE_LIMIT_MAX`
   - Uso: limite de intentos por ventana
7. `CONTACT_RATE_LIMIT_WINDOW_SEC`
   - Uso: ventana de rate-limit en segundos

## 2) Variables usadas en codigo y no reportadas en esta pasada

1. `ALLOWED_ORIGINS`
   - Uso: validacion de origen permitido en `/api/contact`
   - Estado: no reportada en la lista actual de Vercel para esta revision
   - Nota: existe fallback de host/vercel, pero se recomienda mantenerla explicita para dominios productivos.

## 3) Uso real en codigo (referencia)

- `apps/kumera-web/src/pages/api/contact.ts`

## 4) Regla operativa

1. Toda variable nueva debe:
   - agregarse en `apps/kumera-web/.env.example`
   - documentarse aqui (`env-contract.md`)
   - quedar reflejada en README del app (si aplica)
2. Variables en Vercel sin uso en codigo:
   - marcarlas como `legacy` o eliminarlas.
