import { headers } from "next/headers";
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fail, ok } from "@/lib/http";
import { contractAcceptSchema } from "@/lib/validation";
import { resolveValidToken, writeAuditLog } from "@/lib/onboarding";
import { applyRateLimit } from "@/lib/rate-limit";

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

  const headerStore = await headers();
  const ip = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = headerStore.get("user-agent") ?? "unknown";
  const traceId = headerStore.get("x-kumera-trace-id") ?? crypto.randomUUID();
  void writeAuditLog("contract.accept.received", "onboarding-token", {
    traceId,
    subscriptionId,
    ip,
  });
  const rateLimit = applyRateLimit({
    key: `contract-accept:${ip ?? "unknown"}:${subscriptionId}`,
    windowMs: 60_000,
    max: 12,
  });
  if (!rateLimit.ok) {
    await writeAuditLog("security.rate_limit.blocked", "onboarding-token", {
      traceId,
      endpoint: "contract.accept",
      ip,
      subscriptionId,
    });
    return fail(429, "RATE_LIMITED", `Too many requests. Try again in a minute. (trace ${traceId})`);
  }

  const tokenStatus = await resolveValidToken(parsed.data.token);
  if (!tokenStatus.ok || tokenStatus.record.subscription_id !== subscriptionId) {
    await writeAuditLog("contract.accept.failed", "onboarding-token", {
      traceId,
      subscriptionId,
      ip,
      reason: "TOKEN_INVALID_OR_SCOPE_MISMATCH",
    });
    return fail(401, "TOKEN_INVALID", `Token is invalid for this subscription (trace ${traceId})`);
  }

  const supabase = createAdminClient();
  const acceptedAt = new Date().toISOString();

  const { data: existingContract, error: existingContractError } = await supabase
    .from("contracts")
    .select("id")
    .eq("subscription_id", subscriptionId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingContractError) {
    return fail(500, "DB_ERROR", `Failed to fetch contract (trace ${traceId})`, existingContractError.message);
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
      return fail(500, "DB_ERROR", `Failed to update contract acceptance (trace ${traceId})`, updateContractError.message);
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
      return fail(500, "DB_ERROR", `Failed to save contract acceptance (trace ${traceId})`, insertContractError.message);
    }
  }

  // Non-blocking audit/event writes to keep signature response fast for the client.
  void writeAuditLog("contract.accepted", "onboarding-token", {
    traceId,
    subscriptionId,
    tokenId: tokenStatus.record.id,
    signerName: parsed.data.signerName,
    signerRut: parsed.data.signerRut,
    signerEmail: parsed.data.signerEmail,
    acceptedAt,
    acceptedIp: ip,
  });
  void supabase.from("onboarding_events").insert({
    subscription_id: subscriptionId,
    token_id: tokenStatus.record.id,
    event_type: "contract.accepted",
      payload: {
      traceId,
        signerName: parsed.data.signerName,
      signerRut: parsed.data.signerRut,
      signerEmail: parsed.data.signerEmail,
      acceptedAt,
      acceptedIp: ip,
      acceptedUserAgent: userAgent,
    },
  });

  return ok({ accepted: true, traceId });
}
