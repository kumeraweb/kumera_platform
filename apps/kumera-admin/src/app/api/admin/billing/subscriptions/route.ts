import { requireAdminApi, ROLE } from "@/lib/auth";
import { createBillingServiceClient } from "@/lib/db";
import { fail, ok } from "@/lib/http";

export async function GET() {
  const auth = await requireAdminApi([ROLE.BILLING]);
  if (!auth.ok) return auth.response;

  const billing = createBillingServiceClient();
  const { data, error } = await billing
    .from("subscriptions")
    .select("id,status,created_at,company_id,companies(legal_name),services(slug,name),plans(id,name,price_cents)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return fail(error.message, 500);
  return ok({ subscriptions: data ?? [] });
}
