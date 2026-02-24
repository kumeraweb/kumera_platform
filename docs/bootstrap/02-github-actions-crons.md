# GitHub Actions Crons (Billing + LeadOS)

Workflows creados:

1. `.github/workflows/billing-crons.yml`
2. `.github/workflows/leados-reminders-cron.yml`

## Secrets requeridos en GitHub repo

En `Settings -> Secrets and variables -> Actions -> New repository secret`:

1. `BILLING_BASE_URL`
- Ejemplo: `https://tu-proyecto-billing.vercel.app`

2. `BILLING_CRON_SECRET`
- Debe ser exactamente el mismo valor que `APP_CRON_SECRET` (o `CRON_SECRET`) en Vercel del proyecto `apps/kumerabilling-web`.

3. `LEADOS_BASE_URL`
- Ejemplo: `https://tu-proyecto-leados.vercel.app`

4. `LEADOS_CRON_SECRET`
- Debe ser exactamente el mismo valor que `APP_CRON_SECRET` (o `INTERNAL_CRON_SECRET`) en Vercel del proyecto `apps/leadosku-web/leados-system`.

## Frecuencias actuales

1. Billing: cada hora (`5 * * * *`)
2. LeadOS reminders: cada 5 minutos (`*/5 * * * *`)

## Prueba manual

1. Ir a `Actions`.
2. Ejecutar manualmente:
- `Billing Crons`
- `LeadOS Reminders Cron`
3. Verificar status `green`.
