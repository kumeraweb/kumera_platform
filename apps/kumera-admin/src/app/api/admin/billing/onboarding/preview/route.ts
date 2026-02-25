import { requireAdminApi, ROLE } from "@/lib/auth";
import {
  hashContractContent,
  onboardingSchema,
  renderContractTemplate,
} from "@/lib/billing";
import { createBillingServiceClient } from "@/lib/db";
import { fail, ok } from "@/lib/http";

export async function POST(request: Request) {
  const auth = await requireAdminApi([ROLE.BILLING]);
  if (!auth.ok) return auth.response;

  const parsed = onboardingSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("Invalid onboarding payload", 400);

  const payload = parsed.data;
  const billing = createBillingServiceClient();

  const { data: service, error: serviceError } = await billing
    .from("services")
    .select("id,slug,name")
    .eq("slug", payload.serviceSlug)
    .single();
  if (serviceError || !service) return fail("Service slug not found", 404);

  const { data: plan, error: planError } = await billing
    .from("plans")
    .select("id,name,price_cents,billing_cycle_days,service_id")
    .eq("id", payload.planId)
    .single();
  if (planError || !plan) return fail("Plan not found", 404);
  if (plan.service_id !== service.id) return fail("Plan does not belong to selected service", 400);

  const { data: template, error: templateError } = await billing
    .from("contract_templates")
    .select("id,name,version,status,service_id,target_customer_type,html_template")
    .eq("id", payload.contractTemplateId)
    .single();
  if (templateError || !template) return fail("Contract template not found", 404);
  if (template.service_id !== service.id) return fail("Template does not belong to selected service", 400);
  if (template.status !== "active") return fail("Contract template is not active", 400);
  if (template.target_customer_type !== "any" && template.target_customer_type !== payload.customerType) {
    return fail("Contract template does not match customer type", 400);
  }

  const monthlyAmountCents = Number(plan.price_cents ?? 0);
  const generatedDate = new Date().toLocaleDateString("es-CL");
  const renderedContract = renderContractTemplate(template.html_template, {
    customer_type: payload.customerType,
    company_legal_name: payload.companyName,
    company_rut: payload.rut,
    company_address: payload.address,
    company_email: payload.email,
    company_phone: payload.phone,
    legal_representative_name: payload.legalRepresentativeName || "-",
    legal_representative_rut: payload.legalRepresentativeRut || "-",
    tax_document_type: payload.taxDocumentType,
    service_name: service.name,
    service_slug: service.slug,
    plan_name: plan.name,
    monthly_amount_clp: String(Math.floor(monthlyAmountCents / 100)),
    generated_date: generatedDate,
    kumera_signed_date: generatedDate,
    subscription_id: "PREVIEW",
  });

  return ok({
    service: { id: service.id, slug: service.slug, name: service.name },
    plan: { id: plan.id, name: plan.name, priceCents: monthlyAmountCents },
    template: { id: template.id, name: template.name, version: template.version },
    contract: {
      htmlRendered: renderedContract,
      contentHash: hashContractContent(renderedContract),
    },
  });
}
