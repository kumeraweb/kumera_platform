# Kumera Admin - Env Contract

Last updated: 2026-03-05

App: `apps/kumera-admin`

## 1) Variables confirmadas en Vercel (pasada actual)

Estas variables fueron reportadas como cargadas y estan en uso real en codigo:

1. `CONTACT_FROM_EMAIL`
   - Uso: fallback remitente en flujos billing
2. `CONTACT_REPLY_TO_EMAIL`
   - Uso: fallback reply-to en flujos billing
3. `CONTACT_INBOX_EMAIL`
   - Uso: destino auditoria/operacion billing
4. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Uso: cliente browser Supabase + fallback build
5. `SUPABASE_ANON_KEY`
   - Uso: fallback server anon key
6. `NEXT_PUBLIC_SUPABASE_URL`
   - Uso: cliente browser Supabase + fallback build
7. `LEADOS_SECRETS_KEY`
   - Uso: cifrado/descifrado (`crypto.ts`)
8. `SUPABASE_URL`
   - Uso: conexion server Supabase
9. `SUPABASE_SERVICE_ROLE_KEY`
   - Uso: operaciones administrativas server

## 2) Variables usadas en codigo y no reportadas en esta pasada

1. `RESEND_API_KEY`
   - Uso: envios de correo de validacion/facturacion billing
2. `BILLING_ONBOARDING_BASE_URL`
   - Uso: base URL de onboarding (default: `https://clientes.kumeraweb.com`)
3. `BILLING_ONBOARDING_TOKEN_TTL_HOURS`
   - Uso: TTL token onboarding (default: `72`)
4. `BILLING_PAYMENT_LINK_TTL_HOURS`
   - Uso: TTL links de pago (default: `168`)
5. `BILLING_VALIDATION_FROM_EMAIL`
   - Uso: remitente validacion billing (fallback a `CONTACT_FROM_EMAIL`)
6. `BILLING_VALIDATION_REPLY_TO_EMAIL`
   - Uso: reply-to validacion billing (fallback a `CONTACT_REPLY_TO_EMAIL`)
7. `BILLING_VALIDATION_AUDIT_TO_EMAIL`
   - Uso: destino auditoria billing (fallback a `CONTACT_INBOX_EMAIL`)
8. `BILLING_INVOICE_FROM_EMAIL`
   - Uso: remitente facturacion billing (fallback chain)
9. `BILLING_INVOICE_REPLY_TO_EMAIL`
   - Uso: reply-to facturacion billing (fallback chain)
10. `BILLING_LEGACY_ADMIN_URL`
    - Uso: link legado admin billing (default: `https://clientes.kumeraweb.com/admin`)
11. `NEXT_PUBLIC_TUEJECUTIVA_SITE_URL`
    - Uso: links emitidos para onboarding Tuejecutiva (default: `https://tuejecutiva.cl`)

## 3) Uso real en codigo (referencia)

1. `apps/kumera-admin/src/lib/db.ts`
2. `apps/kumera-admin/src/lib/auth-browser.ts`
3. `apps/kumera-admin/src/lib/crypto.ts`
4. `apps/kumera-admin/src/lib/billing.ts`
5. `apps/kumera-admin/src/app/api/admin/billing/subscriptions/[subscriptionId]/payment-link/route.ts`
6. `apps/kumera-admin/src/app/api/admin/tuejecutiva/tokens/route.ts`
7. `apps/kumera-admin/src/app/admin/billing/page.tsx`
8. `apps/kumera-admin/next.config.ts`

## 4) Regla operativa

1. Toda variable nueva debe:
   - agregarse en `.env.example` del app (si no existe, crearlo)
   - documentarse aqui (`env-contract.md`)
   - quedar reflejada en README del app (si aplica)
2. Variables en Vercel sin uso en codigo:
   - marcarlas como `legacy` o eliminarlas.
