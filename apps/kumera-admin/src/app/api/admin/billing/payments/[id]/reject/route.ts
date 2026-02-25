import { requireAdminApi, ROLE } from "@/lib/auth";
import { createBillingServiceClient } from "@/lib/db";
import { fail, ok } from "@/lib/http";
import { paymentRejectSchema, writeBillingAuditLog } from "@/lib/billing";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi([ROLE.BILLING]);
  if (!auth.ok) return auth.response;

  const parsed = paymentRejectSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("Invalid reject payload", 400);

  const { id } = await context.params;
  const billing = createBillingServiceClient();

  const { error } = await billing
    .from("payments")
    .update({ status: "rejected", rejection_reason: parsed.data.reason, validated_at: null })
    .eq("id", id);
  if (error) return fail(error.message, 500);

  await writeBillingAuditLog("payment.rejected", auth.user.id, {
    paymentId: id,
    reason: parsed.data.reason,
  });

  return ok({ rejected: true });
}
