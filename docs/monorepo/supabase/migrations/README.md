# Supabase Migrations (Canonical Global Chain)

Why global:
- Kumera uses a single Supabase project for multiple apps/schemas.
- A single ordered migration timeline is required for deterministic deploys.

Ownership model:
- Files stay in one chain here, but each migration must declare owner app/domain in filename and/or SQL header.
- Recommended filename pattern:
  - `<timestamp>_<seq>_<owner>_<change>.sql`
  - owners: `core`, `billing`, `tuejecutiva`, `leados`, `platform`

Per-app relationship:
- Each app keeps its own schema source and migration index under `docs/applications/<app>/`.
- Do not create competing migration chains under app folders.

Current status:
- Active canonical files are all SQL files in this folder.
