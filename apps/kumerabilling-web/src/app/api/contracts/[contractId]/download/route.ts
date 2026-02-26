import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fail } from "@/lib/http";
import { isTokenExpired } from "@/lib/domain/billing";
import { writeAuditLog } from "@/lib/onboarding";
import { resolveValidPaymentAccessToken } from "@/lib/payment-access";
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

  const supabase = createAdminClient();
  const { data: onboardingTokenRow, error: onboardingTokenError } = await supabase
    .from("onboarding_tokens")
    .select("subscription_id,expires_at,revoked_at")
    .eq("token", token)
    .maybeSingle();

  let subscriptionId: string | null = null;
  if (
    !onboardingTokenError &&
    onboardingTokenRow &&
    !onboardingTokenRow.revoked_at &&
    !isTokenExpired(new Date(onboardingTokenRow.expires_at), new Date())
  ) {
    subscriptionId = onboardingTokenRow.subscription_id;
  } else {
    const paymentTokenStatus = await resolveValidPaymentAccessToken(token);
    if (paymentTokenStatus.ok) {
      subscriptionId = paymentTokenStatus.record.subscription_id;
    }
  }

  if (!subscriptionId) {
    await writeAuditLog("contract.download.failed", "access-token", {
      contractId,
      ip,
      reason: "TOKEN_INVALID",
    });
    return fail(401, "TOKEN_INVALID", "Invalid token");
  }

  const { data: contract, error: contractError } = await supabase
    .from("contracts")
    .select("id,subscription_id,version,html_rendered")
    .eq("id", contractId)
    .maybeSingle();

  if (contractError || !contract || !contract.html_rendered) {
    return fail(404, "CONTRACT_NOT_FOUND", "Contract not found");
  }

  if (contract.subscription_id !== subscriptionId) {
    return fail(403, "FORBIDDEN", "Contract does not belong to token subscription");
  }

  const title = "Acuerdo de prestación de servicios";
  const pdfUrl = `/api/contracts/${encodeURIComponent(contract.id)}/pdf?token=${encodeURIComponent(token)}`;
  const printableHtml = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      :root { color-scheme: light; }
      body { margin: 0; background: #f3f4f6; color: #111827; font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; }
      .toolbar { position: sticky; top: 0; z-index: 10; display: flex; gap: 10px; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid #e5e7eb; background: #ffffff; }
      .toolbar-actions { display: flex; gap: 8px; }
      .toolbar-btn { display: inline-flex; align-items: center; justify-content: center; border: 1px solid #d1d5db; background: #ffffff; color: #111827; border-radius: 8px; padding: 8px 12px; font-size: 12px; font-weight: 600; text-decoration: none; cursor: pointer; }
      .toolbar-btn:hover { background: #f9fafb; }
      .hint { margin: 0; font-size: 12px; color: #4b5563; }
      .sheet-wrap { padding: 20px 12px; }
      .sheet { max-width: 900px; margin: 0 auto; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
      @media (min-width: 768px) { .sheet-wrap { padding: 28px; } .sheet { padding: 28px; } }
      @media print {
        body { background: #fff; }
        .toolbar { display: none; }
        .sheet-wrap { padding: 0; }
        .sheet { max-width: none; border: 0; border-radius: 0; box-shadow: none; padding: 0; margin: 0; }
      }
    </style>
  </head>
  <body>
    <div class="toolbar">
      <p class="hint">Contrato en formato imprimible. Usa Ctrl+P o Cmd+P y selecciona "Guardar como PDF".</p>
      <div class="toolbar-actions">
        <a id="download-pdf-btn" class="toolbar-btn" href="${pdfUrl}">Descargar PDF</a>
        <a id="print-btn" class="toolbar-btn" href="#">Imprimir</a>
      </div>
    </div>
    <main class="sheet-wrap">
      <article class="sheet">
        ${contract.html_rendered}
      </article>
    </main>
    <script src="/contract-print-actions.js"></script>
  </body>
</html>`;

  return new Response(printableHtml, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": "inline",
      "Cache-Control": "no-store",
    },
  });
}
