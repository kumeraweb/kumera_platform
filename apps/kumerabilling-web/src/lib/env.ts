const requiredEnv = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

export function assertPublicEnv() {
  for (const key of requiredEnv) {
    if (!process.env[key]) {
      throw new Error(`Missing env var: ${key}`);
    }
  }
}

export function getServiceRoleKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("Missing env var: SUPABASE_SERVICE_ROLE_KEY");
  }
  return key;
}

export function getCronSecret() {
  const key = process.env.APP_CRON_SECRET || process.env.CRON_SECRET;
  if (!key) {
    throw new Error("Missing env var: APP_CRON_SECRET or CRON_SECRET");
  }
  return key;
}
