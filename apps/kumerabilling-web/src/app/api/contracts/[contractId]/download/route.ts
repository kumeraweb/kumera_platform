import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fail } from "@/lib/http";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ contractId: string }> },
) {
  const { contractId } = await context.params;
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return fail(400, "VALIDATION_ERROR", "token is required");
  }

  const supabase = createAdminClient();
  const { data: tokenRow, error: tokenError } = await supabase
    .from("onboarding_tokens")
    .select("subscription_id,revoked_at")
    .eq("token", token)
    .maybeSingle();

  if (tokenError || !tokenRow || tokenRow.revoked_at) {
    return fail(401, "TOKEN_INVALID", "Invalid onboarding token");
  }

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

