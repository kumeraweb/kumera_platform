import { z } from "zod";
import { requireAdminApi, ROLE } from "@/lib/auth";
import { writeBillingAuditLog } from "@/lib/billing";
import { createBillingServiceClient } from "@/lib/db";
import { fail, ok } from "@/lib/http";

const updateStatusSchema = z.object({
  status: z.enum(["active", "suspended", "cancelled"]),
  reason: z.string().max(500).optional(),
});

export async function POST(request: Request, context: { params: Promise<{ subscriptionId: string }> }) {
  const auth = await requireAdminApi([ROLE.BILLING]);
  if (!auth.ok) return auth.response;

  const { subscriptionId } = await context.params;
  const parsed = updateStatusSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Payload inválido", 400);
  }

  const nextStatus = parsed.data.status;
  const reason = parsed.data.reason?.trim() || null;
  const billing = createBillingServiceClient();

  const { data: existing, error: existingError } = await billing
    .from("subscriptions")
    .select("id,status")
    .eq("id", subscriptionId)
    .maybeSingle();
  if (existingError) return fail(existingError.message, 500);
  if (!existing) return fail("Suscripción no encontrada.", 404);
  if (existing.status === nextStatus) {
    return ok({ updated: true, status: nextStatus, unchanged: true });
  }

  const { error: updateError } = await billing
    .from("subscriptions")
    .update({ status: nextStatus })
    .eq("id", subscriptionId);
  if (updateError) return fail(updateError.message, 500);

  if (nextStatus === "cancelled") {
    const nowIso = new Date().toISOString();
    await billing
      .from("payment_access_tokens")
      .update({ revoked_at: nowIso })
      .eq("subscription_id", subscriptionId)
      .is("consumed_at", null)
      .is("revoked_at", null);
    await billing
      .from("onboarding_tokens")
      .update({ revoked_at: nowIso })
      .eq("subscription_id", subscriptionId)
      .is("consumed_at", null)
      .is("revoked_at", null);
  }

  await writeBillingAuditLog("subscription.status.updated", auth.user.id, {
    subscriptionId,
    previousStatus: existing.status,
    nextStatus,
    reason,
  });

  return ok({ updated: true, status: nextStatus });
}
