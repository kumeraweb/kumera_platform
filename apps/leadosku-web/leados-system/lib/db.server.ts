import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { KUMERA_MESSAGING_SCHEMA } from "@/lib/db";

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

export async function createKumeraMessagingServerClient() {
  const cookieStore = await cookies();

  return createServerClient(getSupabaseUrl(), getAnonKey(), {
    db: { schema: KUMERA_MESSAGING_SCHEMA },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options as never);
        });
      }
    }
  });
}

export async function createLeadosServerClient() {
  return createKumeraMessagingServerClient();
}
