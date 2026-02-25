import { requireAdminApi, ROLE } from "@/lib/auth";
import { createBillingServiceClient } from "@/lib/db";
import { fail, ok } from "@/lib/http";

export async function GET() {
  const auth = await requireAdminApi([ROLE.BILLING]);
  if (!auth.ok) return auth.response;

  const billing = createBillingServiceClient();
  const [
    { data: services, error: servicesError },
    { data: plans, error: plansError },
    { data: templates, error: templatesError },
  ] = await Promise.all([
    billing.from("services").select("id,slug,name").order("name", { ascending: true }),
    billing.from("plans").select("id,service_id,name,price_cents,billing_cycle_days").order("name", { ascending: true }),
    billing
      .from("contract_templates")
      .select("id,service_id,name,version,status,variables_schema,created_at,updated_at")
      .order("created_at", { ascending: false }),
  ]);

  if (servicesError) return fail(servicesError.message, 500);
  if (plansError) return fail(plansError.message, 500);
  if (templatesError) return fail(templatesError.message, 500);

  return ok({ services: services ?? [], plans: plans ?? [], templates: templates ?? [] });
}
