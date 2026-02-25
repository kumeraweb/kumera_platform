import { requireAdminApi, ROLE } from "@/lib/auth";
import { createBillingServiceClient } from "@/lib/db";
import { fail, ok } from "@/lib/http";

export async function GET() {
  const auth = await requireAdminApi([ROLE.BILLING]);
  if (!auth.ok) return auth.response;

  const billing = createBillingServiceClient();
  const { data, error } = await billing
    .from("companies")
    .select("id,legal_name,rut,email,phone,created_at,subscriptions(id,status,services(name),plans(name,price_cents))")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return fail(error.message, 500);
  return ok({ clients: data ?? [] });
}
