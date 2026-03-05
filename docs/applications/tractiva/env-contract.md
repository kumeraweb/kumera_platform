# Tractiva - Env Contract

Last updated: 2026-03-05

App: `apps/tractiva-web`

## 1) Variables confirmadas en Vercel (pasada actual)

Estas variables fueron reportadas como cargadas y estan en uso real en codigo:

1. `AUTOREPLY_FROM_EMAIL`
   - Uso: remitente de auto-reply al lead
2. `CONTACT_REPLY_TO_EMAIL`
   - Uso: reply-to del auto-reply
3. `CONTACT_FROM_EMAIL`
   - Uso: remitente de correo interno
4. `CONTACT_INBOX_EMAIL`
   - Uso: inbox comercial destino de leads
5. `RESEND_API_KEY`
   - Uso: envio de correo interno + auto-reply

## 2) Variables usadas en codigo y no reportadas en esta pasada

1. `ALLOWED_ORIGINS`
   - Uso: validacion de origen permitido en `/api/contact`
2. `CONTACT_RATE_LIMIT_MAX`
   - Uso: limite de intentos por ventana
3. `CONTACT_RATE_LIMIT_WINDOW_SEC`
   - Uso: ventana de rate-limit en segundos

Nota:
- Las tres tienen defaults en codigo, pero se recomienda configurarlas explicitas en Vercel.

## 3) Uso real en codigo (referencia)

1. `apps/tractiva-web/src/pages/api/contact.ts`
2. `apps/tractiva-web/src/lib/server/security.ts`

## 4) Regla operativa

1. Toda variable nueva debe:
   - agregarse en `apps/tractiva-web/.env.example`
   - documentarse aqui (`env-contract.md`)
   - quedar reflejada en README del app (si aplica)
2. Variables en Vercel sin uso en codigo:
   - marcarlas como `legacy` o eliminarlas.
