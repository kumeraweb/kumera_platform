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

## Prevent redeploying all projects on every push
Apply these settings in each Vercel project:

1. Enable `Skip deployments when there are no changes to the root directory or its dependencies`.
2. Set `Ignored Build Step` to:
`node scripts/vercel/ignored-build-step.mjs <app-path>`

Commands per app:
- `kumera-admin`: `node scripts/vercel/ignored-build-step.mjs apps/kumera-admin`
- `kumerabilling-web`: `node scripts/vercel/ignored-build-step.mjs apps/kumerabilling-web`
- `tuejecutiva-web`: `node scripts/vercel/ignored-build-step.mjs apps/tuejecutiva-web`
- `leados-system`: `node scripts/vercel/ignored-build-step.mjs apps/leadosku-web/leados-system`
- `kumera-web`: `node scripts/vercel/ignored-build-step.mjs apps/kumera-web`
- `tractiva-web`: `node scripts/vercel/ignored-build-step.mjs apps/tractiva-web`

Behavior:
- Exit code `0`: Vercel skips deploy for that project.
- Exit code `1`: Vercel proceeds with build/deploy.
