import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fail, ok } from "@/lib/http";
import { contractAcceptSchema } from "@/lib/validation";
import { isTokenExpired } from "@/lib/domain/billing";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ contractId: string }> },
) {
  const { contractId } = await context.params;
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
    tokenRow.revoked_at ||
    tokenRow.consumed_at ||
    isTokenExpired(new Date(tokenRow.expires_at), new Date())
  ) {
    return fail(401, "TOKEN_INVALID", `Token invalid/expired for this contract (trace ${traceId})`);
  }

  const { data: contract, error: contractError } = await supabase
    .from("contracts")
    .select("id,subscription_id,metadata,html_rendered")
    .eq("id", contractId)
    .maybeSingle();

  if (contractError) {
    return fail(500, "DB_ERROR", `Failed to fetch contract (trace ${traceId})`, contractError.message);
  }
  if (!contract) {
    return fail(404, "CONTRACT_NOT_FOUND", `No contract found (trace ${traceId})`);
  }
  if (contract.subscription_id !== tokenRow.subscription_id) {
    return fail(403, "FORBIDDEN", `Contract does not belong to token subscription (trace ${traceId})`);
  }

  const existingMetadata =
    contract.metadata && typeof contract.metadata === "object" && !Array.isArray(contract.metadata)
      ? (contract.metadata as Record<string, unknown>)
      : {};
  const signedDate = new Date(acceptedAt).toLocaleDateString("es-CL");
  const signerLine = `Firmado electrónicamente por ${parsed.data.signerName.trim()} · Fecha: ${signedDate}`;
  const nextHtml =
    typeof contract.html_rendered === "string"
      ? contract.html_rendered.replace("Firma: ________________________", `Firma: ${signerLine}`)
      : contract.html_rendered;

  const { error: updateContractError } = await supabase
    .from("contracts")
    .update({
      accepted: true,
      accepted_at: acceptedAt,
      accepted_ip: ip,
      accepted_user_agent: userAgent,
      html_rendered: nextHtml,
      metadata: {
        ...existingMetadata,
        signerName: parsed.data.signerName,
        signerRut: parsed.data.signerRut,
        signerEmail: parsed.data.signerEmail,
        traceId,
      },
    })
    .eq("id", contract.id);

  if (updateContractError) {
    return fail(500, "DB_ERROR", `Failed to update contract acceptance (trace ${traceId})`, updateContractError.message);
  }

  return ok({ accepted: true, traceId });
}
