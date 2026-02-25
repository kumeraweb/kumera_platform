"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getAdminSupabaseAnonKey, getAdminSupabaseUrl } from "@/lib/db";

export function createAdminBrowserAuthClient() {
  return createBrowserClient(getAdminSupabaseUrl(), getAdminSupabaseAnonKey());
}
