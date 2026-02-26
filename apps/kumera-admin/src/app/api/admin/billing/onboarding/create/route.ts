import { randomUUID } from "node:crypto";
import { requireAdminApi, ROLE } from "@/lib/auth";
import { createBillingServiceClient } from "@/lib/db";
import { fail, ok } from "@/lib/http";
import {
  getOnboardingBaseUrl,
  getOnboardingTokenTtlHours,
  hashContractContent,
  onboardingSchema,
  renderContractTemplate,
  writeBillingAuditLog,
  writeOnboardingEvent,
} from "@/lib/billing";

export async function POST(request: Request) {
  const auth = await requireAdminApi([ROLE.BILLING]);
  if (!auth.ok) return auth.response;

  const parsed = onboardingSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message ?? "Invalid onboarding payload";
    return Response.json(
      {
        error: firstIssue,
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const payload = parsed.data;
  const billing = createBillingServiceClient();

  const { data: company, error: companyError } = await billing
    .from("companies")
    .insert({
      legal_name: payload.companyName,
      rut: payload.rut,
      address: payload.address,
      email: payload.email,
      phone: payload.phone,
      customer_type: payload.customerType,
      legal_representative_name: payload.legalRepresentativeName || null,
      legal_representative_rut: payload.legalRepresentativeRut || null,
      tax_document_type: payload.taxDocumentType,
    })
    .select("id")
    .single();
  if (companyError || !company) return fail(companyError?.message ?? "Failed creating company", 500);

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

  const { data: subscription, error: subscriptionError } = await billing
    .from("subscriptions")
    .insert({
      company_id: company.id,
      service_id: service.id,
      plan_id: plan.id,
      status: "pending_activation",
    })
    .select("id")
    .single();
  if (subscriptionError || !subscription) {
    return fail(subscriptionError?.message ?? "Failed creating subscription", 500);
  }

  const token = randomUUID() + randomUUID();
  const ttlHours = getOnboardingTokenTtlHours();
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString();

  const { data: tokenRow, error: tokenError } = await billing
    .from("onboarding_tokens")
    .insert({
      subscription_id: subscription.id,
      token,
      expires_at: expiresAt,
    })
    .select("id")
    .single();
  if (tokenError || !tokenRow) return fail(tokenError?.message ?? "Could not create token", 500);

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
    subscription_id: subscription.id,
  });
  const contentHash = hashContractContent(renderedContract);

  const { error: contractError } = await billing.from("contracts").insert({
    subscription_id: subscription.id,
    version: template.version,
    template_id: template.id,
    template_version: template.version,
    html_rendered: renderedContract,
    content_hash: contentHash,
    accepted: false,
    metadata: {
      template_name: template.name,
      service_slug: service.slug,
      plan_name: plan.name,
    },
  });
  if (contractError) return fail(contractError.message, 500);

  const { error: paymentError } = await billing.from("payments").insert({
    subscription_id: subscription.id,
    method: "bank_transfer",
    status: "pending",
    amount_cents: monthlyAmountCents,
    due_date: new Date().toISOString(),
  });
  if (paymentError) return fail(paymentError.message, 500);

  await writeOnboardingEvent({
    subscriptionId: subscription.id,
    tokenId: tokenRow.id,
    eventType: "onboarding.created",
    payload: {
      templateId: template.id,
      serviceSlug: service.slug,
      planId: plan.id,
      amountCents: monthlyAmountCents,
    },
  });

  await writeBillingAuditLog("onboarding.created", auth.user.id, {
    companyId: company.id,
    subscriptionId: subscription.id,
    templateId: template.id,
  });

  return ok(
    {
      subscriptionId: subscription.id,
      onboardingToken: token,
      onboardingUrl: `${getOnboardingBaseUrl()}/onboarding/${token}`,
      expiresAt,
    },
    201,
  );
}
