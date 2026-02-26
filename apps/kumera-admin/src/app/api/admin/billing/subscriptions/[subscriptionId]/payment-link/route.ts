import { randomUUID } from "node:crypto";
import { requireAdminApi, ROLE } from "@/lib/auth";
import { createBillingServiceClient } from "@/lib/db";
import { fail, ok } from "@/lib/http";
import { getOnboardingBaseUrl, writeBillingAuditLog } from "@/lib/billing";

function getPaymentLinkTtlHours() {
  const raw = Number(process.env.BILLING_PAYMENT_LINK_TTL_HOURS ?? "168");
  if (!Number.isFinite(raw) || raw <= 0) return 168;
  return Math.floor(raw);
}

export async function POST(_: Request, context: { params: Promise<{ subscriptionId: string }> }) {
  const auth = await requireAdminApi([ROLE.BILLING]);
  if (!auth.ok) return auth.response;

  const { subscriptionId } = await context.params;
  const billing = createBillingServiceClient();

  const { data: payment, error: paymentError } = await billing
    .from("payments")
    .select("id,due_date,status")
    .eq("subscription_id", subscriptionId)
    .eq("status", "pending")
    .order("due_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (paymentError) return fail(paymentError.message, 500);
  if (!payment) return fail("No hay pago pendiente para esta suscripción", 400);

  const nowIso = new Date().toISOString();
  const { error: revokeError } = await billing
    .from("payment_access_tokens")
    .update({ revoked_at: nowIso })
    .eq("subscription_id", subscriptionId)
    .eq("payment_id", payment.id)
    .is("consumed_at", null)
    .is("revoked_at", null);
  if (revokeError) return fail(revokeError.message, 500);

  const token = randomUUID() + randomUUID();
  const ttlHours = getPaymentLinkTtlHours();
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString();

  const { error: tokenError } = await billing.from("payment_access_tokens").insert({
    subscription_id: subscriptionId,
    payment_id: payment.id,
    token,
    expires_at: expiresAt,
  });

  if (tokenError) return fail(tokenError.message, 500);

  await writeBillingAuditLog("payment.link.generated", auth.user.id, {
    subscriptionId,
    paymentId: payment.id,
    expiresAt,
  });

  return ok({
    paymentId: payment.id,
    paymentUrl: `${getOnboardingBaseUrl()}/pago/${token}`,
    expiresAt,
  });
}
