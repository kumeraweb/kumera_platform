import { requireAdminApi, ROLE } from "@/lib/auth";
import { createBillingServiceClient } from "@/lib/db";
import { fail, ok } from "@/lib/http";
import { contractTemplateUpdateSchema, writeBillingAuditLog } from "@/lib/billing";

export async function PATCH(request: Request, context: { params: Promise<{ templateId: string }> }) {
  const auth = await requireAdminApi([ROLE.BILLING]);
  if (!auth.ok) return auth.response;

  const parsed = contractTemplateUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("Invalid payload", 400);

  const { templateId } = await context.params;
  const billing = createBillingServiceClient();

  const patch: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) patch.name = parsed.data.name;
  if (parsed.data.version !== undefined) patch.version = parsed.data.version;
  if (parsed.data.status !== undefined) patch.status = parsed.data.status;
  if (parsed.data.targetCustomerType !== undefined) patch.target_customer_type = parsed.data.targetCustomerType;
  if (parsed.data.htmlTemplate !== undefined) patch.html_template = parsed.data.htmlTemplate;
  if (parsed.data.variablesSchema !== undefined) patch.variables_schema = parsed.data.variablesSchema;

  const { data, error } = await billing
    .from("contract_templates")
    .update(patch)
    .eq("id", templateId)
    .select("id,service_id,name,version,status,target_customer_type,html_template,variables_schema,created_at,updated_at")
    .single();

  if (error || !data) return fail(error?.message ?? "Could not update template", 500);

  await writeBillingAuditLog("contract_template.updated", auth.user.id, { templateId });

  return ok({ template: data });
}
