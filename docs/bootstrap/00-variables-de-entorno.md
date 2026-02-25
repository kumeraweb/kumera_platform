# Variables de entorno por proyecto (Kumera Platform v2)

Este documento define **qué variables debe tener cada proyecto** para levantarlo dentro del nuevo monorepo y contra el Supabase unificado.

## Convenciones generales

- `SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_URL` deben apuntar al **mismo proyecto Supabase nuevo**.
- `SUPABASE_SERVICE_ROLE_KEY` se usa solo en backend (API routes/server).
- `APP_CRON_SECRET` es el secreto preferido para jobs; `CRON_SECRET` se mantiene por compatibilidad.
- En migración controlada, `*_DB_SCHEMA` puede iniciar en `public` y luego moverse a su schema final.

## 1) `apps/kumera-admin`

Archivo sugerido: `.env.local`

Obligatorias:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (o `SUPABASE_ANON_KEY`)
- `LEADOS_SECRETS_KEY` (si usarás módulo LeadOS admin para crear/rotar canales)

Opcionales:

- `NEXT_PUBLIC_SUPABASE_URL` (fallback de `SUPABASE_URL`)

Ejemplo:

```env
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_ANON_KEY=<anon-key>
LEADOS_SECRETS_KEY=<base64-32-bytes>
```

## 2) `apps/kumerabilling-web`

Archivo base: `.env.example`

Obligatorias:

- `NEXT_PUBLIC_APP_URL`
- `SUPABASE_URL` (o `NEXT_PUBLIC_SUPABASE_URL`, recomendado definir ambas)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_ANON_KEY` (recomendado mantenerlo igual que `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- `SUPABASE_SERVICE_ROLE_KEY`
- `APP_CRON_SECRET` (y opcional `CRON_SECRET` igual valor)

Email (según operación):

- `EMAIL_PROVIDER`
- `EMAIL_FROM`
- `EMAIL_ADMIN_INBOX`

Ejemplo:

```env
NEXT_PUBLIC_APP_URL=https://kumera-clientes.vercel.app
SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
APP_CRON_SECRET=<random-long-secret>
CRON_SECRET=<random-long-secret>
EMAIL_PROVIDER=resend
EMAIL_FROM=no-reply@kumeraweb.com
EMAIL_ADMIN_INBOX=admin@kumeraweb.com
```

## 3) `apps/tuejecutiva-web`

Archivo base: `.env.example`

Obligatorias:

- `SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_ANON_KEY` (recomendado)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Migración controlada:

- `TUEJECUTIVA_DB_SCHEMA`:
  - recomendado desde inicio: `tuejecutiva`
  - solo transición legacy: `public`
- `TUEJECUTIVA_ENFORCE_BILLING_SUBSCRIPTION`:
  - `false` al inicio
  - luego `true`
- `TUEJECUTIVA_SERVICE_SUBJECT_ID` (id lógico para consulta a billing)

Recomendadas adicionales:

- `NEXT_PUBLIC_SITE_URL`
- `RESEND_API_KEY` (si usas endpoint de contacto)

Ejemplo:

```env
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
TUEJECUTIVA_DB_SCHEMA=tuejecutiva
TUEJECUTIVA_ENFORCE_BILLING_SUBSCRIPTION=false
TUEJECUTIVA_SERVICE_SUBJECT_ID=tuejecutiva-default
NEXT_PUBLIC_SITE_URL=https://tuejecutiva.cl
RESEND_API_KEY=<resend-key>
```

## 4) `apps/leadosku-web/leados-system`

Archivo base: `.env.example`

Obligatorias:

- `SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `LEADOS_SECRETS_KEY`
- `BACKOFFICE_ADMIN_EMAIL`
- `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
- `APP_CRON_SECRET` (o `CRON_SECRET`)

Migración controlada:

- `LEADOS_DB_SCHEMA`:
  - recomendado desde inicio: `leados`
  - solo transición legacy: `public`
- `LEADOS_ENFORCE_BILLING_SUBSCRIPTION`:
  - `false` al inicio
  - luego `true`

Operativas recomendadas:

- `OPENAI_API_KEY`
- `RESEND_API_KEY`
- `META_API_BASE_URL`
- límites anti-abuso y horarios de recordatorio

Ejemplo:

```env
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
LEADOS_DB_SCHEMA=leados
LEADOS_ENFORCE_BILLING_SUBSCRIPTION=false
LEADOS_SECRETS_KEY=<32-plus-random-chars>
BACKOFFICE_ADMIN_EMAIL=admin@kumeraweb.com
WHATSAPP_WEBHOOK_VERIFY_TOKEN=<verify-token>
NOTIFICATION_FROM_EMAIL=contacto@kumeraweb.com
OPENAI_API_KEY=<openai-key>
META_API_BASE_URL=https://graph.facebook.com/v20.0
RESEND_API_KEY=<resend-key>
APP_CRON_SECRET=<random-long-secret>
CRON_SECRET=<random-long-secret>
INTERNAL_CRON_SECRET=
LEAD_REOPEN_COOLDOWN_SECONDS=180
WEBHOOK_RATE_LIMIT_WINDOW_SECONDS=60
WEBHOOK_RATE_LIMIT_MAX_MESSAGES=10
LEAD_MAX_BOT_TURNS=40
LEAD_MAX_SAME_STEP_EVENTS=8
REMINDER_TIMEZONE=America/Santiago
REMINDER_ALLOWED_START_HOUR=9
REMINDER_ALLOWED_END_HOUR=19
```

## 5) `apps/tractiva-web` (Astro)

Archivo base: `.env.example`

Obligatorias (si operas panel + contacto):

- `RESEND_API_KEY`
- `ALLOWED_ORIGINS`
- `PANEL_PASSWORD`

Recomendadas:

- rate limits `PANEL_*` y `CONTACT_*`

## 6) `apps/kumera-web` (Astro)

Actualmente no requiere variables obligatorias para build básico.

## 7) Recomendación de gestión en Vercel

Para cada proyecto en Vercel:

- Definir variables por **Environment** (`Development`, `Preview`, `Production`).
- No reutilizar `SERVICE_ROLE_KEY` en proyectos donde no sea necesario.
- Rotar secretos (`APP_CRON_SECRET`, `PANEL_PASSWORD`, tokens de terceros) cada vez que hagas reset de infraestructura.
