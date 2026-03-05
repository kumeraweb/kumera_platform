# LeadOS (leados-system) - Env Contract

Last updated: 2026-03-05

App: `apps/leadosku-web/leados-system`

## 1) Variables confirmadas en Vercel (pasada actual)

Estas variables fueron reportadas como cargadas y estan en uso real en codigo:

1. `META_API_BASE_URL`
   - Uso: base URL de Meta Graph API
   - Referencia: `lib/env.ts`
2. `REMINDER_TIMEZONE`
   - Uso: timezone de envio de recordatorios
   - Referencia: `lib/env.ts`
3. `REMINDER_ALLOWED_START_HOUR`
   - Uso: hora inicial permitida para recordatorios
   - Referencia: `lib/env.ts`
4. `REMINDER_ALLOWED_END_HOUR`
   - Uso: hora final permitida para recordatorios
   - Referencia: `lib/env.ts`
5. `LEAD_REOPEN_COOLDOWN_SECONDS`
   - Uso: cooldown de reapertura de lead
   - Referencia: `app/api/webhooks/whatsapp/route.ts`
6. `WEBHOOK_RATE_LIMIT_WINDOW_SECONDS`
   - Uso: ventana de rate limit inbound WhatsApp
   - Referencia: `app/api/webhooks/whatsapp/route.ts`
7. `WEBHOOK_RATE_LIMIT_MAX_MESSAGES`
   - Uso: maximo de mensajes por ventana
   - Referencia: `app/api/webhooks/whatsapp/route.ts`
8. `LEAD_MAX_BOT_TURNS`
   - Uso: limite de turnos del bot por lead
   - Referencia: `app/api/webhooks/whatsapp/route.ts`
9. `LEAD_MAX_SAME_STEP_EVENTS`
   - Uso: limite de eventos repetidos en el mismo paso
   - Referencia: `app/api/webhooks/whatsapp/route.ts`

## 2) Variables core tambien usadas por LeadOS (pendiente de confirmacion operativa en Vercel)

Estas aparecen en runtime y deben estar inventariadas tambien:

1. `SUPABASE_URL`
2. `SUPABASE_ANON_KEY`
3. `SUPABASE_SERVICE_ROLE_KEY`
4. `NEXT_PUBLIC_SUPABASE_URL`
5. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. `LEADOS_DB_SCHEMA`
7. `LEADOS_ENFORCE_BILLING_SUBSCRIPTION`
8. `LEADOS_SECRETS_KEY`
9. `BACKOFFICE_ADMIN_EMAIL`
10. `KUMERA_ADMIN_URL`
11. `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
12. `WHATSAPP_SKIP_SIGNATURE_CHECK`
13. `WHATSAPP_WEBHOOK_DEBUG`
14. `NOTIFICATION_FROM_EMAIL`
15. `NOTIFICATION_EMAIL_SUBJECT`
16. `OPENAI_API_KEY`
17. `RESEND_API_KEY`
18. `APP_CRON_SECRET`
19. `CRON_SECRET` (fallback legacy)
20. `INTERNAL_CRON_SECRET`

## 3) Regla operativa

1. Toda variable nueva debe:
   - agregarse en `apps/leadosku-web/leados-system/.env.example`
   - documentarse aqui (`env-contract.md`)
   - quedar reflejada en README del app (si aplica)
2. Variables en Vercel sin uso en codigo:
   - marcarlas como `legacy` o eliminarlas.
