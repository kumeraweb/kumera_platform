# Paso 02 - Conectar apps en Vercel y variables

Objetivo:

- Dejar cada app deployable por separado desde su subcarpeta.
- Cargar variables correctas para el Supabase nuevo.

Referencia completa de variables:

- [00-variables-de-entorno.md](/Users/javiernfigueroa/Documents/code/kumera-platform/docs/bootstrap/00-variables-de-entorno.md)

## 1) Crear proyectos en Vercel (Root Directory por app)

1. `apps/kumerabilling-web`
2. `apps/kumera-admin`
3. `apps/tuejecutiva-web`
4. `apps/leadosku-web/leados-system`
5. `apps/kumera-web`
6. `apps/tractiva-web`

## 2) Cargar variables minimas por app

## Billing (`apps/kumerabilling-web`)

1. `NEXT_PUBLIC_APP_URL`
2. `SUPABASE_URL`
3. `NEXT_PUBLIC_SUPABASE_URL`
4. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. `SUPABASE_ANON_KEY`
6. `SUPABASE_SERVICE_ROLE_KEY`
7. `APP_CRON_SECRET` (o `CRON_SECRET`)

## Admin (`apps/kumera-admin`)

1. `SUPABASE_URL`
2. `SUPABASE_SERVICE_ROLE_KEY`
3. opcional `NEXT_PUBLIC_SUPABASE_URL`

## Tuejecutiva (`apps/tuejecutiva-web`)

1. `SUPABASE_URL`
2. `SUPABASE_ANON_KEY`
3. `SUPABASE_SERVICE_ROLE_KEY`
4. `NEXT_PUBLIC_SUPABASE_URL`
5. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. `TUEJECUTIVA_DB_SCHEMA=tuejecutiva`
7. `TUEJECUTIVA_ENFORCE_BILLING_SUBSCRIPTION=false` (inicial)
8. `TUEJECUTIVA_SERVICE_SUBJECT_ID=<definir>`

## LeadOS (`apps/leadosku-web/leados-system`)

1. `SUPABASE_URL`
2. `SUPABASE_ANON_KEY`
3. `SUPABASE_SERVICE_ROLE_KEY`
4. `NEXT_PUBLIC_SUPABASE_URL`
5. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. `LEADOS_DB_SCHEMA=leados`
7. `LEADOS_ENFORCE_BILLING_SUBSCRIPTION=false` (inicial)
8. `LEADOS_SECRETS_KEY`
9. `BACKOFFICE_ADMIN_EMAIL`
10. `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
11. `APP_CRON_SECRET` (o `CRON_SECRET`)

## Astro apps

1. `apps/tractiva-web`: cargar solo variables realmente usadas (`RESEND_API_KEY`, `ALLOWED_ORIGINS`, `PANEL_PASSWORD`, etc.).
2. `apps/kumera-web`: no requiere variables obligatorias para build base.

## 3) Deploy y smoke test por app

1. Deploy production por cada proyecto.
2. Verificar que arranca sin error de variables.
3. Confirmar que cada app usa su propio proyecto Vercel y no depende de otro app.
