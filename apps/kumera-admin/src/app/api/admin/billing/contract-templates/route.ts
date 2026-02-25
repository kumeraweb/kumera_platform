import { requireAdminApi, ROLE } from "@/lib/auth";
import { createBillingServiceClient } from "@/lib/db";
import { fail, ok } from "@/lib/http";
import { contractTemplateCreateSchema, writeBillingAuditLog } from "@/lib/billing";

export async function GET(request: Request) {
  const auth = await requireAdminApi([ROLE.BILLING]);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const serviceId = url.searchParams.get("serviceId");
  const billing = createBillingServiceClient();

  let query = billing
    .from("contract_templates")
    .select("id,service_id,name,version,status,html_template,variables_schema,created_at,updated_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (serviceId) query = query.eq("service_id", serviceId);

  const { data, error } = await query;
  if (error) return fail(error.message, 500);

  return ok({ templates: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireAdminApi([ROLE.BILLING]);
  if (!auth.ok) return auth.response;

  const parsed = contractTemplateCreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("Invalid payload", 400);

  const body = parsed.data;
  const billing = createBillingServiceClient();

  const { data, error } = await billing
    .from("contract_templates")
    .insert({
      service_id: body.serviceId,
      name: body.name,
      version: body.version,
      status: body.status,
      html_template: body.htmlTemplate,
      variables_schema: body.variablesSchema,
    })
    .select("id,service_id,name,version,status,html_template,variables_schema,created_at,updated_at")
    .single();

  if (error || !data) return fail(error?.message ?? "Could not create template", 500);

  await writeBillingAuditLog("contract_template.created", auth.user.id, {
    templateId: data.id,
    serviceId: data.service_id,
    version: data.version,
  });

  return ok({ template: data }, 201);
}
