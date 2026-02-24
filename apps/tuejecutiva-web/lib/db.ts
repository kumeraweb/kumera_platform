import "server-only";
import { createClient } from "@supabase/supabase-js";

export const TUEJECUTIVA_SCHEMA = process.env.TUEJECUTIVA_DB_SCHEMA || "tuejecutiva";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function getSupabaseUrl() {
  return process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || requireEnv("NEXT_PUBLIC_SUPABASE_URL");
}

function getAnonKey() {
  return process.env.SUPABASE_ANON_KEY || requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export function createTuejecutivaAdminClient() {
  return createClient(getSupabaseUrl(), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    db: { schema: TUEJECUTIVA_SCHEMA },
  });
}

export function createTuejecutivaAnonClient() {
  return createClient(getSupabaseUrl(), getAnonKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    db: { schema: TUEJECUTIVA_SCHEMA },
  });
}

export function createTuejecutivaRlsClient(accessToken: string) {
  return createClient(getSupabaseUrl(), getAnonKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    db: { schema: TUEJECUTIVA_SCHEMA },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}
