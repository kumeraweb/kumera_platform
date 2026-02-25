import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fail, ok } from "@/lib/http";
import { resolveValidToken } from "@/lib/onboarding";

export async function GET(_: NextRequest, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;

  const valid = await resolveValidToken(token);
  if (!valid.ok) {
    return fail(401, valid.error, "Invalid or expired onboarding token");
  }

  const supabase = createAdminClient();
  const subscriptionId = valid.record.subscription_id;

  const { data: subscription, error: subscriptionError } = await supabase
    .from("subscriptions")
    .select("id,status,company:companies(legal_name,email,rut,address,phone,tax_document_type),plan:plans(name,price_cents,billing_cycle_days),payments(id,status,due_date)")
    .eq("id", subscriptionId)
    .single();

  if (subscriptionError || !subscription) {
    return fail(404, "SUBSCRIPTION_NOT_FOUND", "Onboarding data not found", subscriptionError?.message);
  }

  const { data: contract } = await supabase
    .from("contracts")
    .select("id,version,accepted,accepted_at,html_rendered,content_hash")
    .eq("subscription_id", subscriptionId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  await supabase.from("onboarding_events").insert({
    subscription_id: subscriptionId,
    token_id: valid.record.id,
    event_type: "onboarding.opened",
    payload: {},
  });

  return ok({
    subscription,
    contract: contract ?? null,
    expiresAt: valid.record.expires_at,
  });
}
