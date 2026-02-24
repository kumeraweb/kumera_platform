import { createClient } from "@supabase/supabase-js";
import type { AccessDecision, ServiceKey, SubscriptionStatus } from "../../types/src/index";

function requireServiceEnv() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    throw new Error("Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  return { url, serviceRole };
}

export async function getServiceAccess(params: {
  serviceKey: ServiceKey;
  serviceSubjectId: string;
}): Promise<AccessDecision> {
  const { url, serviceRole } = requireServiceEnv();
  const client = createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    db: { schema: "billing" }
  });

  const { data, error } = await client
    .from("subscriptions")
    .select("status")
    .eq("service_key", params.serviceKey)
    .eq("service_subject_id", params.serviceSubjectId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return { allowed: false, reason: "subscription_not_found", status: null };
  }

  if (!data?.status) {
    return { allowed: false, reason: "subscription_not_found", status: null };
  }

  const status = data.status as SubscriptionStatus;
  const allowed = status === "active" || status === "trial";

  return {
    allowed,
    reason: allowed ? "active_subscription" : "subscription_inactive",
    status
  };
}
