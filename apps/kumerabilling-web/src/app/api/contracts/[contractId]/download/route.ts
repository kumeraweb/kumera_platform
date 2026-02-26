import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fail } from "@/lib/http";
import { resolveValidToken, writeAuditLog } from "@/lib/onboarding";
import { applyRateLimit } from "@/lib/rate-limit";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ contractId: string }> },
) {
  const { contractId } = await context.params;
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return fail(400, "VALIDATION_ERROR", "token is required");
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const rateLimit = applyRateLimit({
    key: `contract-download:${ip ?? "unknown"}:${contractId}`,
    windowMs: 60_000,
    max: 20,
  });
  if (!rateLimit.ok) {
    await writeAuditLog("security.rate_limit.blocked", "onboarding-token", {
      endpoint: "contract.download",
      ip,
      contractId,
    });
    return fail(429, "RATE_LIMITED", "Too many requests. Try again in a minute.");
  }

  const tokenStatus = await resolveValidToken(token);
  if (!tokenStatus.ok) {
    await writeAuditLog("contract.download.failed", "onboarding-token", {
      contractId,
      ip,
      reason: "TOKEN_INVALID",
    });
    return fail(401, "TOKEN_INVALID", "Invalid onboarding token");
  }

  const supabase = createAdminClient();
  const tokenRow = tokenStatus.record;

  const { data: contract, error: contractError } = await supabase
    .from("contracts")
    .select("id,subscription_id,version,html_rendered")
    .eq("id", contractId)
    .maybeSingle();

  if (contractError || !contract || !contract.html_rendered) {
    return fail(404, "CONTRACT_NOT_FOUND", "Contract not found");
  }

  if (contract.subscription_id !== tokenRow.subscription_id) {
    return fail(403, "FORBIDDEN", "Contract does not belong to token subscription");
  }

  const filename = `contrato-${contract.id}-${contract.version || "v1"}.html`;
  return new Response(contract.html_rendered, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename=\"${filename}\"`,
      "Cache-Control": "no-store",
    },
  });
}
