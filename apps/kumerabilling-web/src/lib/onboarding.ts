import { createAdminClient } from "@/lib/supabase/admin";
import { isTokenExpired } from "@/lib/domain/billing";

export async function resolveValidToken(token: string) {
  const supabase = createAdminClient();

  const { data: record, error } = await supabase
    .from("onboarding_tokens")
    .select("id,subscription_id,expires_at,revoked_at,consumed_at")
    .eq("token", token)
    .maybeSingle();

  if (error || !record) {
    return { ok: false as const, error: "TOKEN_NOT_FOUND" };
  }

  if (record.revoked_at) {
    return { ok: false as const, error: "TOKEN_REVOKED" };
  }

  if (record.consumed_at) {
    return { ok: false as const, error: "TOKEN_CONSUMED" };
  }

  if (isTokenExpired(new Date(record.expires_at), new Date())) {
    return { ok: false as const, error: "TOKEN_EXPIRED" };
  }

  return { ok: true as const, record };
}

export async function writeAuditLog(action: string, actor: string, payload: Record<string, unknown>) {
  const supabase = createAdminClient();
  await supabase.from("audit_logs").insert({
    action,
    actor,
    payload,
  });
}
