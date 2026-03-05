# Billing (kumerabilling-web) - Env Contract

Last updated: 2026-03-05

App: `apps/kumerabilling-web`

## 1) Requeridas en produccion (Vercel)

1. `NEXT_PUBLIC_APP_URL`
   - Scope: public/client + server
   - Uso: URL base para armado de links y render PDF
2. `SUPABASE_URL`
   - Scope: server
   - Uso: conexion DB
3. `SUPABASE_SERVICE_ROLE_KEY`
   - Scope: server (secreto)
   - Uso: operaciones administrativas billing
4. `NEXT_PUBLIC_SUPABASE_URL`
   - Scope: public/client
   - Uso: cliente browser Supabase
5. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Scope: public/client
   - Uso: cliente browser Supabase
6. `SUPABASE_ANON_KEY`
   - Scope: server
   - Uso: fallback server para anon key
7. `APP_CRON_SECRET`
   - Scope: server (secreto)
   - Uso: autenticacion de cron endpoints
8. `PDFSHIFT_API_KEY`
   - Scope: server (secreto)
   - Uso: generacion PDF de contratos

Estado declarado por operacion (Vercel): presentes.

## 2) Opcionales / fallback de compatibilidad

1. `CRON_SECRET`
   - Scope: server
   - Uso: fallback legacy si falta `APP_CRON_SECRET`
   - Regla: preferir `APP_CRON_SECRET` como canonico.

## 3) Uso real en codigo (referencia)

1. Supabase URL/keys:
   - `apps/kumerabilling-web/src/lib/db.ts`
   - `apps/kumerabilling-web/src/lib/db.server.ts`
2. Service role / cron secret:
   - `apps/kumerabilling-web/src/lib/env.ts`
3. PDFShift + app URL:
   - `apps/kumerabilling-web/src/app/api/contracts/[contractId]/pdf/route.ts`

## 4) Regla operativa

1. Toda variable nueva debe:
   - agregarse en `apps/kumerabilling-web/.env.example`
   - documentarse aqui (`env-contract.md`)
   - quedar reflejada en `apps/kumerabilling-web/README.md` (si aplica)
2. Variables en Vercel sin uso en codigo:
   - marcarlas como `legacy` o eliminarlas.
