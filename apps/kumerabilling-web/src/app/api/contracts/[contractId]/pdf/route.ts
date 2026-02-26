import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fail } from "@/lib/http";
import { isTokenExpired } from "@/lib/domain/billing";
import { writeAuditLog } from "@/lib/onboarding";
import { resolveValidPaymentAccessToken } from "@/lib/payment-access";
import { applyRateLimit } from "@/lib/rate-limit";

function getPdfShiftKey() {
  const key = process.env.PDFSHIFT_API_KEY;
  if (!key) {
    throw new Error("Missing env var: PDFSHIFT_API_KEY");
  }
  return key;
}

function getAppBaseUrl(request: NextRequest) {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (envUrl) {
    return envUrl.replace(/\/+$/, "");
  }
  const fallback = request.nextUrl.origin;
  return fallback.replace(/\/+$/, "");
}

function buildContractHtml(title: string, bodyHtml: string) {
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      :root { color-scheme: light; }
      body { margin: 0; background: #ffffff; color: #111827; font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; }
      .sheet-wrap { padding: 0; }
      .sheet { max-width: 900px; margin: 0 auto; background: #fff; padding: 0; }
      @page { size: A4; margin: 14mm; }
    </style>
  </head>
  <body>
    <main class="sheet-wrap">
      <article class="sheet">
        ${bodyHtml}
      </article>
    </main>
  </body>
</html>`;
}

function sanitizeFilename(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

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
    key: `contract-pdf:${ip ?? "unknown"}:${contractId}`,
    windowMs: 60_000,
    max: 10,
  });
  if (!rateLimit.ok) {
    await writeAuditLog("security.rate_limit.blocked", "access-token", {
      endpoint: "contract.pdf",
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
    await writeAuditLog("contract.pdf.failed", "access-token", {
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

  let apiKey: string;
  try {
    apiKey = getPdfShiftKey();
  } catch {
    return fail(500, "PDF_PROVIDER_NOT_CONFIGURED", "PDF provider is not configured");
  }

  const title = "Acuerdo de prestacion de servicios";
  const appBaseUrl = getAppBaseUrl(request);
  const renderedWithAbsoluteAssets = contract.html_rendered.replace(
    /src=(["'])\/sign\.png\1/g,
    `src="${appBaseUrl}/sign.png"`,
  );
  const source = buildContractHtml(title, renderedWithAbsoluteAssets);

  const providerResponse = await fetch("https://api.pdfshift.io/v3/convert/pdf", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
    },
    body: JSON.stringify({ source, sandbox: false }),
    cache: "no-store",
  });

  if (!providerResponse.ok) {
    const detail = await providerResponse.text().catch(() => "");
    await writeAuditLog("contract.pdf.failed", "pdf-provider", {
      contractId,
      status: providerResponse.status,
      detail,
    });
    return fail(502, "PDF_PROVIDER_ERROR", "Failed to generate PDF");
  }

  const pdfBytes = await providerResponse.arrayBuffer();
  const numericId = (contract.id.match(/\d+/g)?.join("") || "").slice(0, 12);
  const filenameBase = sanitizeFilename(`acuerdo_${numericId || Date.now().toString()}`);

  return new Response(pdfBytes, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filenameBase}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
