import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fail, ok } from "@/lib/http";
import { resolveValidToken, writeAuditLog } from "@/lib/onboarding";
import { resolveValidPaymentAccessToken } from "@/lib/payment-access";
import { applyRateLimit } from "@/lib/rate-limit";

const allowedMime = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
]);

const maxBytes = 8 * 1024 * 1024;

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ paymentId: string }> },
) {
  const { paymentId } = await context.params;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const rateLimit = applyRateLimit({
    key: `transfer-proof:${ip ?? "unknown"}:${paymentId}`,
    windowMs: 60_000,
    max: 8,
  });
  if (!rateLimit.ok) {
    await writeAuditLog("security.rate_limit.blocked", "onboarding-token", {
      endpoint: "payment.transfer_proof.upload",
      ip,
      paymentId,
    });
    return fail(429, "RATE_LIMITED", "Too many uploads. Try again in a minute.");
  }

  const formData = await request.formData();

  const token = formData.get("token");
  const file = formData.get("file");

  if (typeof token !== "string") {
    return fail(400, "VALIDATION_ERROR", "Token requerido");
  }

  if (!(file instanceof File)) {
    return fail(400, "VALIDATION_ERROR", "Archivo requerido");
  }

  if (!allowedMime.has(file.type)) {
    return fail(400, "INVALID_FILE_TYPE", "Solo se permiten archivos de imagen");
  }

  if (file.size > maxBytes) {
    return fail(400, "FILE_TOO_LARGE", "El tamaño máximo permitido es 8MB");
  }

  const onboardingTokenStatus = await resolveValidToken(token);
  const paymentAccessTokenStatus = onboardingTokenStatus.ok
    ? null
    : await resolveValidPaymentAccessToken(token);
  const tokenSource = onboardingTokenStatus.ok ? "onboarding" : paymentAccessTokenStatus?.ok ? "payment-link" : null;

  if (!tokenSource) {
    await writeAuditLog("payment.transfer_proof.failed", "onboarding-token", {
      paymentId,
      ip,
      reason: "TOKEN_INVALID",
    });
    return fail(401, "TOKEN_INVALID", "Token inválido o expirado");
  }

  const supabase = createAdminClient();
  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .select("id,subscription_id")
    .eq("id", paymentId)
    .single();

  if (paymentError || !payment) {
    return fail(404, "PAYMENT_NOT_FOUND", "Pago no encontrado", paymentError?.message);
  }

  let scopedSubscriptionId = "";
  let paymentScopedPaymentId: string | null = null;

  if (onboardingTokenStatus.ok) {
    scopedSubscriptionId = onboardingTokenStatus.record.subscription_id;
  } else if (paymentAccessTokenStatus?.ok) {
    scopedSubscriptionId = paymentAccessTokenStatus.record.subscription_id;
    paymentScopedPaymentId = paymentAccessTokenStatus.record.payment_id;
  }

  if (payment.subscription_id !== scopedSubscriptionId) {
    return fail(401, "TOKEN_SCOPE_ERROR", "Token does not match payment subscription");
  }
  if (tokenSource === "payment-link" && payment.id !== paymentScopedPaymentId) {
    return fail(401, "TOKEN_SCOPE_ERROR", "Token does not match payment");
  }

  const arrayBuffer = await file.arrayBuffer();
  const byteArray = new Uint8Array(arrayBuffer);
  const ext = file.type.split("/")[1] ?? "jpg";
  const path = `transfer-proofs/${paymentId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("payment-proofs")
    .upload(path, byteArray, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return fail(500, "STORAGE_ERROR", "Failed to upload transfer proof", uploadError.message);
  }

  const { error: proofError } = await supabase.from("payment_transfer_proofs").insert({
    payment_id: paymentId,
    file_path: path,
    mime_type: file.type,
    size_bytes: file.size,
  });

  if (proofError) {
    return fail(500, "DB_ERROR", "Failed to register transfer proof", proofError.message);
  }

  await writeAuditLog("payment.transfer_proof.uploaded", "onboarding-token", {
    paymentId,
    path,
  });

  if (onboardingTokenStatus.ok) {
    await supabase
      .from("onboarding_tokens")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", onboardingTokenStatus.record.id);
  } else {
    if (!paymentAccessTokenStatus?.ok) {
      return fail(401, "TOKEN_INVALID", "Token inválido");
    }
    await supabase
      .from("payment_access_tokens")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", paymentAccessTokenStatus.record.id);
  }

  const onboardingTokenId = onboardingTokenStatus.ok ? onboardingTokenStatus.record.id : null;

  await supabase.from("onboarding_events").insert({
    subscription_id: payment.subscription_id,
    token_id: onboardingTokenId,
    event_type: "payment.transfer_proof.uploaded",
    payload: { paymentId, path, tokenSource },
  });

  return ok({ uploaded: true, path });
}
