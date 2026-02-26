import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fail, ok } from "@/lib/http";
import { resolveValidToken, writeAuditLog } from "@/lib/onboarding";
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
    return fail(400, "VALIDATION_ERROR", "token is required");
  }

  if (!(file instanceof File)) {
    return fail(400, "VALIDATION_ERROR", "file is required");
  }

  if (!allowedMime.has(file.type)) {
    return fail(400, "INVALID_FILE_TYPE", "Only image files are allowed");
  }

  if (file.size > maxBytes) {
    return fail(400, "FILE_TOO_LARGE", "Max file size is 8MB");
  }

  const tokenStatus = await resolveValidToken(token);
  if (!tokenStatus.ok) {
    await writeAuditLog("payment.transfer_proof.failed", "onboarding-token", {
      paymentId,
      ip,
      reason: "TOKEN_INVALID",
    });
    return fail(401, "TOKEN_INVALID", "Invalid or expired token");
  }

  const supabase = createAdminClient();
  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .select("id,subscription_id")
    .eq("id", paymentId)
    .single();

  if (paymentError || !payment) {
    return fail(404, "PAYMENT_NOT_FOUND", "Payment not found", paymentError?.message);
  }

  if (payment.subscription_id !== tokenStatus.record.subscription_id) {
    return fail(401, "TOKEN_SCOPE_ERROR", "Token does not match payment subscription");
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

  await supabase
    .from("onboarding_tokens")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", tokenStatus.record.id);

  await supabase.from("onboarding_events").insert({
    subscription_id: payment.subscription_id,
    token_id: tokenStatus.record.id,
    event_type: "payment.transfer_proof.uploaded",
    payload: { paymentId, path },
  });

  return ok({ uploaded: true, path });
}
