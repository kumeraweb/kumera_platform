import { requireAdminApi, ROLE } from "@/lib/auth";
import { createBillingServiceClient } from "@/lib/db";
import { fail, ok } from "@/lib/http";
import { writeBillingAuditLog } from "@/lib/billing";

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi([ROLE.BILLING]);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const billing = createBillingServiceClient();

  const { data: payment, error: paymentError } = await billing
    .from("payments")
    .select("id,status,subscription_id")
    .eq("id", id)
    .maybeSingle();

  if (paymentError) return fail(paymentError.message, 500);
  if (!payment) return fail("Payment not found", 404);
  if (payment.status !== "rejected") {
    return fail("Solo se puede eliminar definitivamente un pago rechazado", 400);
  }

  const { data: subscription, error: subscriptionError } = await billing
    .from("subscriptions")
    .select("id,company_id")
    .eq("id", payment.subscription_id)
    .maybeSingle();
  if (subscriptionError) return fail(subscriptionError.message, 500);

  if (subscription) {
    const { error: deleteSubscriptionError } = await billing
      .from("subscriptions")
      .delete()
      .eq("id", subscription.id);
    if (deleteSubscriptionError) return fail(deleteSubscriptionError.message, 500);

    const { count: remainingSubscriptions, error: remainingSubscriptionsError } = await billing
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("company_id", subscription.company_id);
    if (remainingSubscriptionsError) return fail(remainingSubscriptionsError.message, 500);

    if ((remainingSubscriptions ?? 0) === 0) {
      const { error: deleteCompanyError } = await billing
        .from("companies")
        .delete()
        .eq("id", subscription.company_id);
      if (deleteCompanyError) return fail(deleteCompanyError.message, 500);
    }
  }

  await writeBillingAuditLog("payment.rejected.deleted_permanently", auth.user.id, {
    paymentId: id,
    subscriptionId: payment.subscription_id,
    deletedCompany: Boolean(subscription),
  });

  return ok({ deleted: true });
}
