import { isTokenExpired } from "@/lib/domain/billing";
import { createAdminClient } from "@/lib/supabase/admin";

export async function resolveValidPaymentAccessToken(token: string) {
  const supabase = createAdminClient();

  const { data: record, error } = await supabase
    .from("payment_access_tokens")
    .select("id,subscription_id,payment_id,expires_at,revoked_at,consumed_at")
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
