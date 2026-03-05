# Sitiora Supabase Schema

Sitiora no posee schema de dominio dedicado en esta fase.

## Integracion actual
- Usa billing como punto de formalizacion comercial.
- Servicio canonical: `billing.services.slug = sitiora`.
- Planes y contratos se gestionan en schema `billing`.

## Referencias
- `docs/applications/billing/supabase/schema.md`
- `docs/applications/billing/supabase/migrations/20260304_000015_billing_sitiora_service_plans_template.sql`
