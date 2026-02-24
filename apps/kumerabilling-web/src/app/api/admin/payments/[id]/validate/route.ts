import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateNextPaymentDate } from "@/lib/domain/billing";
import { requireAdmin } from "@/lib/auth";
import { fail, ok } from "@/lib/http";
import { writeAuditLog } from "@/lib/onboarding";

export async function POST(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return fail(401, "UNAUTHORIZED", "Admin session is required");
  }

  const { id } = await context.params;
  const supabase = createAdminClient();

  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .select("id,subscription_id,amount_cents")
    .eq("id", id)
    .single();

  if (paymentError || !payment) {
    return fail(404, "PAYMENT_NOT_FOUND", "Payment not found", paymentError?.message);
  }

  const now = new Date();

  const { error: updateError } = await supabase
    .from("payments")
    .update({
      status: "validated",
      validated_at: now.toISOString(),
      rejection_reason: null,
    })
    .eq("id", id);

  if (updateError) {
    return fail(500, "DB_ERROR", "Failed to validate payment", updateError.message);
  }

  const nextDueDate = calculateNextPaymentDate(now);

  await supabase.from("payments").insert({
    subscription_id: payment.subscription_id,
    method: "bank_transfer",
    amount_cents: payment.amount_cents,
    status: "pending",
    due_date: nextDueDate.toISOString(),
  });

  await writeAuditLog("payment.validated", auth.userId, { paymentId: id });

  return ok({ validated: true, nextDueDate: nextDueDate.toISOString() });
}
