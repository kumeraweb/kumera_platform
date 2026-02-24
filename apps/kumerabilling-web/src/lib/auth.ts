import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return { authorized: false as const, reason: "unauthenticated" };
  }

  const { data: profile, error: roleError } = await supabase
    .from("admin_profiles")
    .select("role")
    .eq("user_id", authData.user.id)
    .maybeSingle();

  if (roleError || !profile || profile.role !== "admin") {
    return { authorized: false as const, reason: "forbidden" };
  }

  return { authorized: true as const, userId: authData.user.id };
}
