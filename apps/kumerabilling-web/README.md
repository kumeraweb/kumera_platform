# Kumera Clientes

Portal interno centralizado para onboarding, contrato digital simple y validación manual de pagos por transferencia.

## Stack
- Next.js (App Router) + TypeScript
- Tailwind CSS
- Supabase (DB/Auth/Storage)
- GitHub Actions para jobs diarios

## Scripts
- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run typecheck`
- `npm run test`

## Configuración
1. Copiar `.env.example` a `.env.local` y completar variables.
2. Usar como referencia las migraciones documentadas en:
   - `docs/monorepo/supabase/migrations/`
   - `docs/applications/billing/supabase/migrations/`
3. Cargar seed local `apps/kumerabilling-web/supabase/seed.sql` si aplica al entorno.
4. Crear bucket de storage `payment-proofs` en Supabase.
5. Crear usuario admin en Supabase Auth e insertar su perfil en `admin_profiles`.

## Jobs diarios (GitHub Actions)
Workflow: `.github/workflows/daily-jobs.yml`.

Secrets requeridos:
- `APP_URL` (ej. `https://clientes.kumeraweb.com`)
- `CRON_SECRET`
