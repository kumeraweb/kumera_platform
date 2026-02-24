import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

export const BILLING_SCHEMA = "billing";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }
  return value;
}

function getSupabaseUrl(): string {
  return (
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    requireEnv("NEXT_PUBLIC_SUPABASE_URL")
  );
}

function getAnonKey(): string {
  return process.env.SUPABASE_ANON_KEY || requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export function createBillingAdminClient() {
  return createClient(getSupabaseUrl(), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    db: { schema: BILLING_SCHEMA },
  });
}

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getBillingBrowserClient() {
  if (!browserClient) {
    browserClient = createBrowserClient(getSupabaseUrl(), getAnonKey(), {
      db: { schema: BILLING_SCHEMA },
    });
  }
  return browserClient;
}
