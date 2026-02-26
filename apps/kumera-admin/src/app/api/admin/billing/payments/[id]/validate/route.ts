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
    .select("id,subscription_id,amount_cents,status")
    .eq("id", id)
    .single();
  if (paymentError || !payment) return fail("Payment not found", 404);
  if (payment.status === "validated") {
    return ok({ validated: true, alreadyValidated: true });
  }

  const now = new Date();
  const { error: updateError } = await billing
    .from("payments")
    .update({ status: "validated", validated_at: now.toISOString(), rejection_reason: null })
    .eq("id", id);
  if (updateError) return fail(updateError.message, 500);

  const { data: existingNextPending, error: existingNextPendingError } = await billing
    .from("payments")
    .select("id,due_date")
    .eq("subscription_id", payment.subscription_id)
    .eq("status", "pending")
    .neq("id", payment.id)
    .gte("due_date", now.toISOString())
    .order("due_date", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (existingNextPendingError) return fail(existingNextPendingError.message, 500);

  const nextDueDate = calculateNextPaymentDate(now);
  if (!existingNextPending) {
    const { error: insertError } = await billing.from("payments").insert({
      subscription_id: payment.subscription_id,
      method: "bank_transfer",
      amount_cents: payment.amount_cents,
      status: "pending",
      due_date: nextDueDate.toISOString(),
    });
    if (insertError) return fail(insertError.message, 500);
  }

  const { error: subscriptionUpdateError } = await billing
    .from("subscriptions")
    .update({ status: "active" })
    .eq("id", payment.subscription_id)
    .in("status", ["pending_activation", "suspended"]);
  if (subscriptionUpdateError) return fail(subscriptionUpdateError.message, 500);

  await writeBillingAuditLog("payment.validated", auth.user.id, { paymentId: id });

  return ok({
    validated: true,
    nextDueDate: (existingNextPending?.due_date ?? nextDueDate.toISOString()),
    generatedNextPayment: !existingNextPending,
  });
}
