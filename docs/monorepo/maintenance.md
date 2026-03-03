# Monorepo Docs + Ops Maintenance

This is the canonical operational checklist for platform maintenance.

## Documentation anti-sprawl rules
1. New docs only under `monorepo/`, `applications/<app>/`, or `shared/`.
2. One canonical source per app: `source-of-truth.md`.
3. One Supabase area per app: `applications/<app>/supabase/`.
4. One backlog per app: `next-steps.md`.

## Critical Supabase operational checks
1. Exposed schemas in Supabase API must include:
   - `public`, `graphql_public`, `core`, `billing`, `tuejecutiva`, `leados`
2. Grants and RLS are both required.
3. Validate no business tables in `public`.
4. Use manual SQL references when needed:
   - `docs/monorepo/supabase/manual-sql/seed-minimo.sql`
   - `docs/monorepo/supabase/manual-sql/checks-post.sql`

## Critical cross-app secret consistency
1. `LEADOS_SECRETS_KEY` must be identical in:
   - `apps/kumera-admin`
   - `apps/leadosku-web/leados-system`
2. If mismatch: webhook flows fail (`500`) and leads/messages are not created.

## Vercel monorepo deployment guardrails
1. Configure each Vercel project with its app subdirectory as Root Directory.
2. Enable skip deploys when root directory has no changes.
3. Use ignored build step script per app:
   - `node scripts/vercel/ignored-build-step.mjs <app-path>`

## LeadOS onboarding sequence (must be complete)
1. Create client.
2. Assign user (`user_clients`).
3. Configure channel (`phone_number_id`, `meta_access_token`, `meta_app_secret`).
4. Activate client flow.
