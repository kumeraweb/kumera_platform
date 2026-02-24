# Vercel Subdirectory Deploy Setup

Each app is independently deployable from its own subdirectory.

## Recommended projects
- `apps/kumera-admin`
- `apps/kumerabilling-web`
- `apps/tuejecutiva-web`
- `apps/leadosku-web/leados-system`
- `apps/kumera-web`
- `apps/tractiva-web`

## Required Vercel settings per project
- Root Directory: set to the app subdirectory.
- Build Command: default from app `package.json`.
- Install Command: `npm ci`.
- Environment Variables: scoped per app.
- Cron jobs: managed from GitHub Actions and secure endpoints.
