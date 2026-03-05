# Monorepo Source of Truth

Last updated: 2026-03-04

## Repository model
- One GitHub repository.
- Multiple independently deployable apps under `apps/*`.
- Shared code only under `packages/*`.
- One shared Supabase project.

## Canonical schemas
- `core`
- `billing`
- `tuejecutiva`
- `leados`

Rules:
- `public` is not for business-domain tables.
- `billing.subscriptions` is canonical for subscription/access state.
- No runtime cross-schema joins between product services.

## Supabase migration references (manual operation model)
Global baseline reference:
- `docs/monorepo/supabase/migrations/20260224_000001_kumera_platform_v2_init.sql`

Domain/app references are kept in each app folder:
- `docs/applications/<app>/supabase/migrations/`

## App -> schema ownership
- Billing: `apps/kumerabilling-web` -> `billing`
- Tuejecutiva: `apps/tuejecutiva-web` -> `tuejecutiva`
- LeadOS: `apps/leadosku-web/leados-system` -> `leados`
- Tractiva: `apps/tractiva-web` -> billing touchpoints (no dedicated tractiva schema yet)
- Sitiora: `apps/sitiora-web` -> billing touchpoints (no dedicated sitiora schema yet)
- Kumera Web: `apps/kumera-web` -> website/contact touchpoints (no dedicated schema)
- Kumera Admin: `apps/kumera-admin` -> cross-schema admin operations
