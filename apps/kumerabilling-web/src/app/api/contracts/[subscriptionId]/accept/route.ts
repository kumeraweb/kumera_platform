import { headers } from "next/headers";
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fail, ok } from "@/lib/http";
import { contractAcceptSchema } from "@/lib/validation";
import { resolveValidToken, writeAuditLog } from "@/lib/onboarding";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ subscriptionId: string }> },
) {
  const { subscriptionId } = await context.params;
  const parsed = contractAcceptSchema.safeParse(await request.json());

  if (!parsed.success) {
    return fail(400, "VALIDATION_ERROR", "Invalid accept payload", parsed.error.flatten());
  }

  const tokenStatus = await resolveValidToken(parsed.data.token);
  if (!tokenStatus.ok || tokenStatus.record.subscription_id !== subscriptionId) {
    return fail(401, "TOKEN_INVALID", "Token is invalid for this subscription");
  }

  const supabase = createAdminClient();
  const headerStore = await headers();

  const ip = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = headerStore.get("user-agent") ?? "unknown";

  const { error } = await supabase.from("contracts").insert({
    subscription_id: subscriptionId,
    version: "v1",
    accepted_at: new Date().toISOString(),
    accepted_ip: ip,
    accepted_user_agent: userAgent,
    accepted: true,
  }).select("id").single();

  if (error) {
    const { data: existingContract } = await supabase
      .from("contracts")
      .select("id")
      .eq("subscription_id", subscriptionId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!existingContract) {
      return fail(500, "DB_ERROR", "Failed to save contract acceptance", error.message);
    }

    const { error: updateContractError } = await supabase
      .from("contracts")
      .update({
        accepted: true,
        accepted_at: new Date().toISOString(),
        accepted_ip: ip,
        accepted_user_agent: userAgent,
      })
      .eq("id", existingContract.id);
    if (updateContractError) {
      return fail(500, "DB_ERROR", "Failed to update contract acceptance", updateContractError.message);
    }
  }

  await supabase
    .from("onboarding_tokens")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", tokenStatus.record.id);

  await writeAuditLog("contract.accepted", "onboarding-token", {
    subscriptionId,
    tokenId: tokenStatus.record.id,
  });

  await supabase.from("onboarding_events").insert({
    subscription_id: subscriptionId,
    token_id: tokenStatus.record.id,
    event_type: "contract.accepted",
    payload: {},
  });

  return ok({ accepted: true });
}
