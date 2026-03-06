import { createClient } from "@supabase/supabase-js";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function getSupabaseUrl() {
  const value = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!value) {
    throw new Error("Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL");
  }
  return value;
}

function createServiceClient(schema: "core" | "billing" | "tuejecutiva" | string) {
  return createClient(getSupabaseUrl(), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    db: { schema },
  });
}

function getKumeraMessagingSchema() {
  return process.env.KUMERA_MESSAGING_DB_SCHEMA || process.env.LEADOS_DB_SCHEMA || "leados";
}

export function createCoreServiceClient() {
  return createServiceClient("core");
}

export function createBillingServiceClient() {
  return createServiceClient("billing");
}

export function createKumeraMessagingServiceClient() {
  return createServiceClient(getKumeraMessagingSchema());
}

export function createLeadosServiceClient() {
  return createKumeraMessagingServiceClient();
}

export function createTuejecutivaServiceClient() {
  return createServiceClient("tuejecutiva");
}

export function getAdminSupabaseUrl() {
  return getSupabaseUrl();
}

export function getAdminSupabaseAnonKey() {
  return process.env.SUPABASE_ANON_KEY || requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
}
