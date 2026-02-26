import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fail, ok } from "@/lib/http";
import { contractAcceptSchema } from "@/lib/validation";
import { isTokenExpired } from "@/lib/domain/billing";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ subscriptionId: string }> },
) {
  const { subscriptionId } = await context.params;
  const traceId = request.headers.get("x-kumera-trace-id") ?? crypto.randomUUID();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(400, "BAD_REQUEST", `Invalid JSON body (trace ${traceId})`);
  }

  const parsed = contractAcceptSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "VALIDATION_ERROR", `Invalid accept payload (trace ${traceId})`, parsed.error.flatten());
  }

  const supabase = createAdminClient();
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = request.headers.get("user-agent") ?? "unknown";
  const acceptedAt = new Date().toISOString();

  const { data: tokenRow, error: tokenError } = await supabase
    .from("onboarding_tokens")
    .select("id,subscription_id,expires_at,revoked_at,consumed_at")
    .eq("token", parsed.data.token)
    .maybeSingle();

  if (
    tokenError ||
    !tokenRow ||
    tokenRow.subscription_id !== subscriptionId ||
    tokenRow.revoked_at ||
    tokenRow.consumed_at ||
    isTokenExpired(new Date(tokenRow.expires_at), new Date())
  ) {
    return fail(401, "TOKEN_INVALID", `Token invalid/expired for this subscription (trace ${traceId})`);
  }

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

  if (!existingContract) {
    return fail(404, "CONTRACT_NOT_FOUND", `No contract found for subscription (trace ${traceId})`);
  }

  const { error: updateContractError } = await supabase
    .from("contracts")
    .update({
      accepted: true,
      accepted_at: acceptedAt,
      accepted_ip: ip,
      accepted_user_agent: userAgent,
      metadata: {
        signerName: parsed.data.signerName,
        signerRut: parsed.data.signerRut,
        signerEmail: parsed.data.signerEmail,
        traceId,
      },
    })
    .eq("id", existingContract.id);

  if (updateContractError) {
    return fail(500, "DB_ERROR", `Failed to update contract acceptance (trace ${traceId})`, updateContractError.message);
  }

  return ok({ accepted: true, traceId });
}
