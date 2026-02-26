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
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(400, "BAD_REQUEST", "Invalid JSON body");
  }
  const parsed = contractAcceptSchema.safeParse(body);

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
  const acceptedAt = new Date().toISOString();

  const { data: existingContract, error: existingContractError } = await supabase
    .from("contracts")
    .select("id")
    .eq("subscription_id", subscriptionId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingContractError) {
    return fail(500, "DB_ERROR", "Failed to fetch contract", existingContractError.message);
  }

  if (existingContract) {
    const { error: updateContractError } = await supabase
      .from("contracts")
      .update({
        accepted: true,
        accepted_at: acceptedAt,
        accepted_ip: ip,
        accepted_user_agent: userAgent,
      })
      .eq("id", existingContract.id);
    if (updateContractError) {
      return fail(500, "DB_ERROR", "Failed to update contract acceptance", updateContractError.message);
    }
  } else {
    const { error: insertContractError } = await supabase.from("contracts").insert({
        subscription_id: subscriptionId,
        version: "v1",
        accepted_at: acceptedAt,
        accepted_ip: ip,
        accepted_user_agent: userAgent,
        accepted: true,
      });
    if (insertContractError) {
      return fail(500, "DB_ERROR", "Failed to save contract acceptance", insertContractError.message);
    }
  }

  await Promise.allSettled([
    writeAuditLog("contract.accepted", "onboarding-token", {
      subscriptionId,
      tokenId: tokenStatus.record.id,
      signerName: parsed.data.signerName,
      signerRut: parsed.data.signerRut,
      signerEmail: parsed.data.signerEmail,
      acceptedAt,
      acceptedIp: ip,
    }),
    supabase.from("onboarding_events").insert({
      subscription_id: subscriptionId,
      token_id: tokenStatus.record.id,
      event_type: "contract.accepted",
      payload: {
        signerName: parsed.data.signerName,
        signerRut: parsed.data.signerRut,
        signerEmail: parsed.data.signerEmail,
        acceptedAt,
        acceptedIp: ip,
        acceptedUserAgent: userAgent,
      },
    }),
  ]);

  return ok({ accepted: true });
}
