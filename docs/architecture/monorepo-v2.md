# Kumera Platform v2 Architecture

## Rules
- Each app under `apps/*` is buildable and deployable independently.
- No app-to-app imports are allowed.
- Shared code is allowed only from `packages/*`.
- Supabase business data must live in modular schemas: `core`, `billing`, `tuejecutiva`, `leados`.
- `public` must not store business-domain tables.

## Billing as source of truth
- `billing.subscriptions` is the canonical subscription state.
- Product services query billing access via adapter/service layer (`getServiceAccess`).
- No runtime cross-schema joins between product services.

## Migration sequence
1. Billing
2. Tuejecutiva
3. LeadOS
