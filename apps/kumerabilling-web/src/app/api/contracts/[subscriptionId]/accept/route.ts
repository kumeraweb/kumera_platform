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
  });

  if (error) {
    return fail(500, "DB_ERROR", "Failed to save contract acceptance", error.message);
  }

  await supabase
    .from("onboarding_tokens")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", tokenStatus.record.id);

  await writeAuditLog("contract.accepted", "onboarding-token", {
    subscriptionId,
    tokenId: tokenStatus.record.id,
  });

  return ok({ accepted: true });
}
