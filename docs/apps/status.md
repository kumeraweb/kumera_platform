# App Migration Status

## Stage order
1. Billing (in progress foundation)
2. Tuejecutiva (planned)
3. LeadOS (planned)

## Current implementation notes
- Monorepo workspace scaffold created.
- Unified Supabase schemas initialized via migration.
- `kumera-admin` app created for core roles and billing subscriptions.
- DB adapters added in Billing, Tuejecutiva and LeadOS.
- Tuejecutiva and LeadOS adapters use compatibility flags for staged cutover:
  - `TUEJECUTIVA_DB_SCHEMA` / `LEADOS_DB_SCHEMA` (default `public`).
  - `TUEJECUTIVA_ENFORCE_BILLING_SUBSCRIPTION` / `LEADOS_ENFORCE_BILLING_SUBSCRIPTION` (default `false`).
