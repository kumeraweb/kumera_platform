# Tuejecutiva - Env Contract

Last updated: 2026-03-05

App: `apps/tuejecutiva-web`

## 1) Variables confirmadas en Vercel (pasada actual)

Estas variables fueron reportadas como cargadas y estan en uso real en codigo:

1. `RESEND_API_KEY`
   - Uso: envio de formulario de contacto
   - Referencia: `app/api/contact/route.ts`
2. `SUPABASE_URL`
   - Uso: conexion server a Supabase
   - Referencia: `lib/db.ts`, `lib/billingAccess.ts`
3. `NEXT_PUBLIC_SUPABASE_URL`
   - Uso: cliente/browser Supabase + fallbacks server
   - Referencia: `lib/db.ts`, `lib/executivePhoto.ts`
4. `SUPABASE_ANON_KEY`
   - Uso: anon key server fallback
   - Referencia: `lib/db.ts`
5. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Uso: anon key publica cliente
   - Referencia: `lib/db.ts`
6. `SUPABASE_SERVICE_ROLE_KEY`
   - Uso: operaciones administrativas/privadas
   - Referencia: flujo de acceso billing/admin
7. `TUEJECUTIVA_DB_SCHEMA`
   - Uso: schema activo de datos Tuejecutiva
   - Referencia: `lib/db.ts`
8. `TUEJECUTIVA_ENFORCE_BILLING_SUBSCRIPTION`
   - Uso: enforcement de suscripcion billing
   - Referencia: `lib/adminAuth.ts`
9. `TUEJECUTIVA_SERVICE_SUBJECT_ID`
   - Uso: subject de autorizacion servicio
   - Referencia: `lib/adminAuth.ts`
10. `NEXT_PUBLIC_SITE_URL`
   - Uso: canonical, robots, sitemap, links de onboarding
   - Referencia: `app/layout.tsx`, `app/robots.ts`, `app/sitemap.ts`, `app/admin/page.tsx`

## 2) Variables usadas en codigo con default (recomendadas en Vercel)

Estas se usan en runtime. Si no estan, toman default:

1. `CONTACT_FROM_EMAIL`
   - Default: `TuEjecutiva.cl <contacto@kumeraweb.com>`
2. `AUTOREPLY_FROM_EMAIL`
   - Default: `TuEjecutiva.cl <noreply@kumeraweb.com>`
3. `CONTACT_INBOX_EMAIL`
   - Default: `contacto@kumeraweb.com`
4. `CONTACT_REPLY_TO_EMAIL`
   - Default: `contacto@kumeraweb.com`
5. `KUMERA_ADMIN_URL`
   - Default: `https://kumera-platform-kumera-admin.vercel.app`

## 3) Regla operativa

1. Toda variable nueva debe:
   - agregarse en `apps/tuejecutiva-web/.env.example`
   - documentarse aqui (`env-contract.md`)
   - quedar reflejada en README del app (si aplica)
2. Variables en Vercel sin uso en codigo:
   - marcarlas como `legacy` o eliminarlas.
