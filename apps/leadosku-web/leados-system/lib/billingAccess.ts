import "server-only";
import { createClient } from "@supabase/supabase-js";

type AccessDecision = {
  allowed: boolean;
  reason: "active_subscription" | "subscription_not_found" | "subscription_inactive";
  status: string | null;
};

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

export async function getServiceAccess(params: {
  serviceKey: string;
  serviceSubjectId: string;
}): Promise<AccessDecision> {
  const client = createClient(getSupabaseUrl(), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    db: { schema: "billing" },
  });

  const { data, error } = await client
    .from("subscriptions")
    .select("status")
    .eq("service_key", params.serviceKey)
    .eq("service_subject_id", params.serviceSubjectId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data?.status) {
    return { allowed: false, reason: "subscription_not_found", status: null };
  }

  const status = String(data.status);
  const allowed = status === "active" || status === "trial";
  return {
    allowed,
    reason: allowed ? "active_subscription" : "subscription_inactive",
    status,
  };
}
