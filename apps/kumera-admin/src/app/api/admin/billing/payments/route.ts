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

  return ok({ payments: data ?? [] });
}
