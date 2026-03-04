import { requireAdminApi, ROLE } from "@/lib/auth";
import { createBillingServiceClient } from "@/lib/db";
import { fail, ok } from "@/lib/http";

export async function GET() {
  const auth = await requireAdminApi([ROLE.BILLING]);
  if (!auth.ok) return auth.response;

  const billing = createBillingServiceClient();
  const { data, error } = await billing
    .from("subscriptions")
    .select("id,status,created_at,company_id,companies(legal_name,email),services(slug,name),plans(id,name,price_cents)")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return fail(error.message, 500);
  const subscriptions = data ?? [];
  if (subscriptions.length === 0) return ok({ subscriptions: [] });

  const subscriptionIds = subscriptions.map((subscription) => subscription.id);
  const { data: upcomingPayments, error: upcomingPaymentsError } = await billing
    .from("payments")
    .select("id,subscription_id,due_date,status")
    .in("subscription_id", subscriptionIds)
    .eq("status", "pending")
    .order("due_date", { ascending: true });
  if (upcomingPaymentsError) return fail(upcomingPaymentsError.message, 500);

  const now = new Date();
  const nextDueDateBySubscriptionId = new Map<string, string>();
  const nextPendingPaymentIdBySubscriptionId = new Map<string, string>();
  const fallbackDueDateBySubscriptionId = new Map<string, string>();
  for (const payment of upcomingPayments ?? []) {
    if (!fallbackDueDateBySubscriptionId.has(payment.subscription_id)) {
      fallbackDueDateBySubscriptionId.set(payment.subscription_id, payment.due_date);
    }
    if (new Date(payment.due_date).getTime() >= now.getTime() && !nextDueDateBySubscriptionId.has(payment.subscription_id)) {
      nextDueDateBySubscriptionId.set(payment.subscription_id, payment.due_date);
      nextPendingPaymentIdBySubscriptionId.set(payment.subscription_id, payment.id);
    }
  }

  return ok({
    subscriptions: subscriptions.map((subscription) => ({
      ...subscription,
      next_due_date: nextDueDateBySubscriptionId.get(subscription.id) ?? fallbackDueDateBySubscriptionId.get(subscription.id) ?? null,
      has_pending_payment: nextPendingPaymentIdBySubscriptionId.has(subscription.id),
      next_payment_id: nextPendingPaymentIdBySubscriptionId.get(subscription.id) ?? null,
    })),
  });
}
