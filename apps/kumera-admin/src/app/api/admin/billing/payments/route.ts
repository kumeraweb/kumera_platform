import { requireAdminApi, ROLE } from "@/lib/auth";
import { createBillingServiceClient } from "@/lib/db";
import { fail, ok } from "@/lib/http";

export async function GET(request: Request) {
  const auth = await requireAdminApi([ROLE.BILLING]);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const billing = createBillingServiceClient();

  let query = billing
    .from("payments")
    .select(
      "id,status,amount_cents,due_date,validated_at,rejection_reason,subscription_id,subscriptions(companies(legal_name),services(name),plans(name))",
    )
    .order("due_date", { ascending: true })
    .limit(200);

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return fail(error.message, 500);

  const payments = data ?? [];
  if (payments.length === 0) {
    return ok({ payments: [] });
  }

  const paymentIds = payments.map((payment) => payment.id);
  const subscriptionIds = Array.from(new Set(payments.map((payment) => payment.subscription_id)));

  const [proofsResult, contractsResult] = await Promise.all([
    billing
      .from("payment_transfer_proofs")
      .select("id,payment_id,file_path,mime_type,size_bytes,created_at")
      .in("payment_id", paymentIds)
      .order("created_at", { ascending: false }),
    billing
      .from("contracts")
      .select("id,subscription_id,accepted,created_at")
      .in("subscription_id", subscriptionIds)
      .order("created_at", { ascending: false }),
  ]);

  if (proofsResult.error) return fail(proofsResult.error.message, 500);
  if (contractsResult.error) return fail(contractsResult.error.message, 500);

  const latestProofByPaymentId = new Map<string, (typeof proofsResult.data)[number]>();
  for (const proof of proofsResult.data ?? []) {
    if (!latestProofByPaymentId.has(proof.payment_id)) {
      latestProofByPaymentId.set(proof.payment_id, proof);
    }
  }

  const latestContractBySubscriptionId = new Map<string, (typeof contractsResult.data)[number]>();
  for (const contract of contractsResult.data ?? []) {
    if (!latestContractBySubscriptionId.has(contract.subscription_id)) {
      latestContractBySubscriptionId.set(contract.subscription_id, contract);
    }
  }

  const enrichedPayments = payments.map((payment) => {
    const latestProof = latestProofByPaymentId.get(payment.id) ?? null;
    const latestContract = latestContractBySubscriptionId.get(payment.subscription_id) ?? null;
    const contractAccepted = latestContract?.accepted === true;
    const onboardingState =
      payment.status === "validated"
        ? "completed"
        : contractAccepted && latestProof
          ? "ready_for_review"
          : contractAccepted
            ? "pending_transfer_proof"
            : "pending_contract_signature";

    return {
      ...payment,
      latest_proof: latestProof,
      onboarding_state: onboardingState,
    };
  });

  return ok({ payments: enrichedPayments });
}
