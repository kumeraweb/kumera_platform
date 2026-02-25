import { requireAdminApi, ROLE } from "@/lib/auth";
import { createBillingServiceClient } from "@/lib/db";
import { fail, ok } from "@/lib/http";
import { writeBillingAuditLog } from "@/lib/billing";

function calculateNextPaymentDate(validatedAt: Date): Date {
  const next = new Date(validatedAt);
  next.setMonth(next.getMonth() + 1);
  return next;
}

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi([ROLE.BILLING]);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const billing = createBillingServiceClient();

  const { data: payment, error: paymentError } = await billing
    .from("payments")
    .select("id,subscription_id,amount_cents")
    .eq("id", id)
    .single();
  if (paymentError || !payment) return fail("Payment not found", 404);

  const now = new Date();
  const { error: updateError } = await billing
    .from("payments")
    .update({ status: "validated", validated_at: now.toISOString(), rejection_reason: null })
    .eq("id", id);
  if (updateError) return fail(updateError.message, 500);

  const nextDueDate = calculateNextPaymentDate(now);
  const { error: insertError } = await billing.from("payments").insert({
    subscription_id: payment.subscription_id,
    method: "bank_transfer",
    amount_cents: payment.amount_cents,
    status: "pending",
    due_date: nextDueDate.toISOString(),
  });
  if (insertError) return fail(insertError.message, 500);

  await writeBillingAuditLog("payment.validated", auth.user.id, { paymentId: id });

  return ok({ validated: true, nextDueDate: nextDueDate.toISOString() });
}
