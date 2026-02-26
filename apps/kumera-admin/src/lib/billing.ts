import { createHash } from "node:crypto";
import { z } from "zod";
import { createBillingServiceClient } from "@/lib/db";

export const onboardingSchema = z.object({
  customerType: z.enum(["company", "person"]).default("company"),
  companyName: z.string().min(2),
  rut: z.string().min(3),
  address: z.string().min(5),
  email: z.string().email(),
  phone: z.string().min(6),
  legalRepresentativeName: z.string().optional(),
  legalRepresentativeRut: z.string().optional(),
  serviceSlug: z.string().min(2),
  planId: z.string().uuid(),
  contractTemplateId: z.string().uuid(),
  taxDocumentType: z.enum(["boleta", "factura"]),
});

export const contractTemplateCreateSchema = z.object({
  serviceId: z.string().uuid(),
  name: z.string().min(2),
  version: z.string().min(1),
  status: z.enum(["draft", "active", "archived"]).default("draft"),
  targetCustomerType: z.enum(["company", "person", "any"]).default("company"),
  htmlTemplate: z.string().min(20),
  variablesSchema: z.record(z.string(), z.unknown()).default({}),
});

export const contractTemplateUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  version: z.string().min(1).optional(),
  status: z.enum(["draft", "active", "archived"]).optional(),
  targetCustomerType: z.enum(["company", "person", "any"]).optional(),
  htmlTemplate: z.string().min(20).optional(),
  variablesSchema: z.record(z.string(), z.unknown()).optional(),
});

export const paymentRejectSchema = z.object({
  reason: z.string().min(3),
});

export function getOnboardingBaseUrl() {
  return process.env.BILLING_ONBOARDING_BASE_URL || "https://clientes.kumeraweb.com";
}

export async function writeBillingAuditLog(action: string, actor: string, payload: Record<string, unknown>) {
  const billing = createBillingServiceClient();
  await billing.from("audit_logs").insert({ action, actor, payload });
}

export async function writeOnboardingEvent(params: {
  subscriptionId: string;
  tokenId?: string | null;
  eventType: string;
  payload?: Record<string, unknown>;
}) {
  const billing = createBillingServiceClient();
  await billing.from("onboarding_events").insert({
    subscription_id: params.subscriptionId,
    token_id: params.tokenId ?? null,
    event_type: params.eventType,
    payload: params.payload ?? {},
  });
}

export function renderContractTemplate(templateHtml: string, variables: Record<string, string>) {
  let rendered = templateHtml;
  for (const [key, value] of Object.entries(variables)) {
    const pattern = new RegExp(`{{\\s*${key}\\s*}}`, "g");
    rendered = rendered.replace(pattern, value);
  }
  return rendered;
}

export function hashContractContent(content: string) {
  return createHash("sha256").update(content, "utf8").digest("hex");
}
