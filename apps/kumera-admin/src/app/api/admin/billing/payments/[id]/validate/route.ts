import { requireAdminApi, ROLE } from "@/lib/auth";
import { createBillingServiceClient } from "@/lib/db";
import { fail, ok } from "@/lib/http";
import {
  calculateMonthlyNextPaymentDate,
  sendPaymentValidatedAdminNotice,
  sendPaymentValidatedEmail,
  writeBillingAuditLog,
} from "@/lib/billing";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi([ROLE.BILLING]);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const billing = createBillingServiceClient();

  const { data: payment, error: paymentError } = await billing
    .from("payments")
    .select(`
      id,
      subscription_id,
      amount_cents,
      status,
      subscriptions(
        id,
        companies(legal_name,email),
        services(slug,name),
        plans(name,billing_cycle_days)
      )
    `)
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

  const { error: subscriptionUpdateError } = await billing
    .from("subscriptions")
    .update({ status: "active" })
    .eq("id", payment.subscription_id)
    .in("status", ["pending_activation", "suspended"]);
  if (subscriptionUpdateError) return fail(subscriptionUpdateError.message, 500);

  await writeBillingAuditLog("payment.validated", auth.user.id, { paymentId: id });

  const subscriptionData = Array.isArray(payment.subscriptions) ? payment.subscriptions[0] : payment.subscriptions;
  const companyData = Array.isArray(subscriptionData?.companies) ? subscriptionData?.companies[0] : subscriptionData?.companies;
  const serviceData = Array.isArray(subscriptionData?.services) ? subscriptionData?.services[0] : subscriptionData?.services;
  const planData = Array.isArray(subscriptionData?.plans) ? subscriptionData?.plans[0] : subscriptionData?.plans;
  const billingCycleDays = Number(planData?.billing_cycle_days ?? 30);
  const isRecurringPlan = billingCycleDays > 0;

  let existingNextPending: { id: string; due_date: string } | null = null;
  if (isRecurringPlan) {
    const { data: recurringNextPending, error: recurringNextPendingError } = await billing
      .from("payments")
      .select("id,due_date")
      .eq("subscription_id", payment.subscription_id)
      .eq("status", "pending")
      .neq("id", payment.id)
      .gte("due_date", now.toISOString())
      .order("due_date", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (recurringNextPendingError) return fail(recurringNextPendingError.message, 500);
    existingNextPending = recurringNextPending;

    const nextDueDate = calculateMonthlyNextPaymentDate(now);
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
  }

  const nextDueDateIso = isRecurringPlan
    ? (existingNextPending?.due_date ?? calculateMonthlyNextPaymentDate(now).toISOString())
    : null;
  const companyName = companyData?.legal_name ?? "cliente";
  const serviceName = serviceData?.name ?? "Servicio Kumera";
  const planName = planData?.name ?? "Plan";

  let emailNotification: { sent: boolean; reason?: string } = { sent: false, reason: "missing_recipient" };
  const recipientEmail = companyData?.email?.trim();
  if (recipientEmail) {
    const emailResult = await sendPaymentValidatedEmail({
      to: recipientEmail,
      companyName,
      serviceName,
      planName,
      amountCents: payment.amount_cents,
      validatedAtIso: now.toISOString(),
      nextDueDateIso,
    });

    emailNotification = emailResult.sent
      ? { sent: true }
      : { sent: false, reason: emailResult.reason };

    if (!emailResult.sent) {
      await writeBillingAuditLog("payment.validated.email_failed", auth.user.id, {
        paymentId: id,
        reason: emailResult.reason,
      });
    } else {
      await writeBillingAuditLog("payment.validated.email_sent", auth.user.id, {
        paymentId: id,
        recipientEmail,
      });
    }

  }

  const adminNoticeResult = await sendPaymentValidatedAdminNotice({
    companyName,
    customerEmail: recipientEmail ?? "(sin email registrado)",
    serviceName,
    planName,
    amountCents: payment.amount_cents,
    validatedAtIso: now.toISOString(),
    nextDueDateIso,
    customerEmailSent: emailNotification.sent,
    customerEmailFailureReason: emailNotification.sent ? undefined : emailNotification.reason,
  });

  await writeBillingAuditLog(
    adminNoticeResult.sent ? "payment.validated.admin_notice_sent" : "payment.validated.admin_notice_failed",
    auth.user.id,
    {
      paymentId: id,
      reason: adminNoticeResult.sent ? null : adminNoticeResult.reason,
    },
  );

  return ok({
    validated: true,
    nextDueDate: nextDueDateIso,
    generatedNextPayment: isRecurringPlan ? !existingNextPending : false,
    recurringPlan: isRecurringPlan,
    emailNotification,
  });
}
