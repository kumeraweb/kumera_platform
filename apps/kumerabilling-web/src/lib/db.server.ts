import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { BILLING_SCHEMA } from "@/lib/db";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }
  return value;
}

function getSupabaseUrl(): string {
  return process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || requireEnv("NEXT_PUBLIC_SUPABASE_URL");
}

function getAnonKey(): string {
  return process.env.SUPABASE_ANON_KEY || requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export async function createBillingServerClient() {
  const cookieStore = await cookies();
  return createServerClient(getSupabaseUrl(), getAnonKey(), {
    db: { schema: BILLING_SCHEMA },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        for (const cookie of cookiesToSet) {
          cookieStore.set(cookie.name, cookie.value, cookie.options);
        }
      },
    },
  });
}
