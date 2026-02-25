import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getAdminSupabaseAnonKey, getAdminSupabaseUrl } from "@/lib/db";

export async function createAdminServerAuthClient() {
  const cookieStore = await cookies();
  return createServerClient(getAdminSupabaseUrl(), getAdminSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // no-op on server components during render
        }
      },
    },
  });
}
