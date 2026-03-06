import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

export const KUMERA_MESSAGING_SCHEMA =
  process.env.KUMERA_MESSAGING_DB_SCHEMA || process.env.LEADOS_DB_SCHEMA || "leados";
export const LEADOS_SCHEMA = KUMERA_MESSAGING_SCHEMA;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function getSupabaseUrl() {
  return process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || requireEnv("SUPABASE_URL");
}

function getAnonKey() {
  return process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || requireEnv("SUPABASE_ANON_KEY");
}

export function createKumeraMessagingServiceClient() {
  return createClient(getSupabaseUrl(), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    },
    db: { schema: KUMERA_MESSAGING_SCHEMA }
  });
}

export function createLeadosServiceClient() {
  return createKumeraMessagingServiceClient();
}

export function createKumeraMessagingBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error("Missing browser env: NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!anonKey) {
    throw new Error("Missing browser env: NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return createBrowserClient(url, anonKey, { db: { schema: KUMERA_MESSAGING_SCHEMA } });
}

export function createLeadosBrowserClient() {
  return createKumeraMessagingBrowserClient();
}
