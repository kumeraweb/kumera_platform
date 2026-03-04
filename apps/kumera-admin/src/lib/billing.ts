import { createHash } from "node:crypto";
import { z } from "zod";
import { createBillingServiceClient } from "@/lib/db";

export const onboardingSchema = z
  .object({
    customerType: z.enum(["company", "person"]).default("company"),
    companyName: z.string().min(2),
    rut: z.string().min(3),
    address: z.string().min(5),
    email: z.string().email(),
    phone: z.string().min(6),
    legalRepresentativeName: z.string().optional(),
    legalRepresentativeRut: z.string().optional(),
    serviceSlug: z.string().min(2),
    planId: z.string().uuid().optional(),
    customPlanName: z.string().min(2).max(120).optional(),
    customAmountClp: z.coerce.number().int().min(1).max(100_000_000).optional(),
    contractTemplateId: z.string().uuid(),
    taxDocumentType: z.enum(["boleta", "factura"]),
  })
  .superRefine((data, ctx) => {
    const hasPlanId = Boolean(data.planId);
    const hasCustom = Boolean(data.customPlanName?.trim()) || data.customAmountClp !== undefined;
    if (!hasPlanId && !hasCustom) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Debes seleccionar un plan o definir un plan personalizado.",
        path: ["planId"],
      });
      return;
    }
    if (!hasPlanId && !data.customPlanName?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Debes indicar nombre para el plan personalizado.",
        path: ["customPlanName"],
      });
    }
    if (!hasPlanId && data.customAmountClp === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Debes indicar monto del plan personalizado.",
        path: ["customAmountClp"],
      });
    }
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

export function getOnboardingTokenTtlHours() {
  const raw = Number(process.env.BILLING_ONBOARDING_TOKEN_TTL_HOURS ?? "72");
  if (!Number.isFinite(raw) || raw <= 0) return 72;
  return Math.floor(raw);
}

export function calculateMonthlyNextPaymentDate(validatedAt: Date) {
  return new Date(
    Date.UTC(
      validatedAt.getUTCFullYear(),
      validatedAt.getUTCMonth() + 1,
      validatedAt.getUTCDate(),
      12,
      0,
      0,
      0,
    ),
  );
}

function getBillingValidationFromEmail() {
  return (
    process.env.BILLING_VALIDATION_FROM_EMAIL ||
    process.env.CONTACT_FROM_EMAIL ||
    "Kumera Billing <noreply@kumeraweb.com>"
  );
}

function getBillingValidationReplyToEmail() {
  return (
    process.env.BILLING_VALIDATION_REPLY_TO_EMAIL ||
    process.env.CONTACT_REPLY_TO_EMAIL ||
    "contacto@kumeraweb.com"
  );
}

function getBillingInvoiceFromEmail() {
  return (
    process.env.BILLING_INVOICE_FROM_EMAIL ||
    process.env.BILLING_VALIDATION_FROM_EMAIL ||
    process.env.CONTACT_FROM_EMAIL ||
    "Kumera Billing <noreply@kumeraweb.com>"
  );
}

function getBillingInvoiceReplyToEmail() {
  return (
    process.env.BILLING_INVOICE_REPLY_TO_EMAIL ||
    process.env.BILLING_VALIDATION_REPLY_TO_EMAIL ||
    process.env.CONTACT_REPLY_TO_EMAIL ||
    "contacto@kumeraweb.com"
  );
}

function getBillingValidationAuditToEmail() {
  return process.env.BILLING_VALIDATION_AUDIT_TO_EMAIL || process.env.CONTACT_INBOX_EMAIL || "contacto@kumeraweb.com";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function sendPaymentValidatedEmail(params: {
  to: string;
  companyName: string;
  serviceName: string;
  planName: string;
  amountCents: number;
  validatedAtIso: string;
  nextDueDateIso: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { sent: false as const, reason: "missing_resend_api_key" as const };
  }

  const to = params.to.trim().toLowerCase();
  if (!to) {
    return { sent: false as const, reason: "missing_recipient" as const };
  }

  const validatedAtText = new Date(params.validatedAtIso).toLocaleDateString("es-CL");
  const nextDueDateText = new Date(params.nextDueDateIso).toLocaleDateString("es-CL");
  const amountBase = Math.floor((params.amountCents ?? 0) / 100);
  const ivaAmount = Math.round(amountBase * 0.19);
  const amountTotal = amountBase + ivaAmount;
  const amountBaseText = `$${amountBase.toLocaleString("es-CL")} CLP`;
  const ivaAmountText = `$${ivaAmount.toLocaleString("es-CL")} CLP`;
  const amountTotalText = `$${amountTotal.toLocaleString("es-CL")} CLP`;
  const safeCompanyName = escapeHtml(params.companyName);
  const safeServiceName = escapeHtml(params.serviceName);
  const safePlanName = escapeHtml(params.planName);

  let response: Response;
  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: getBillingValidationFromEmail(),
        to: [to],
        reply_to: getBillingValidationReplyToEmail(),
        subject: "Pago recibido y verificado - Kumera",
        html: `
          <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.6">
            <p>Hola ${safeCompanyName},</p>
            <p>Te confirmamos que tu pago fue recibido y verificado correctamente.</p>
            <ul>
              <li>Servicio: ${safeServiceName}</li>
              <li>Plan: ${safePlanName}</li>
              <li>Monto validado: ${amountBaseText} + IVA (19%: ${ivaAmountText}) = ${amountTotalText}</li>
              <li>Fecha validación: ${validatedAtText}</li>
              <li>Próximo cobro: ${nextDueDateText}</li>
            </ul>
            <p>Tu servicio será activado en las próximas horas.</p>
            <p>Si tienes dudas, responde este correo.</p>
            <p>Equipo Kumera</p>
          </div>
        `,
      }),
    });
  } catch (error) {
    return {
      sent: false as const,
      reason: "provider_network_error" as const,
      details: error instanceof Error ? error.message : "unknown_error",
    };
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    return { sent: false as const, reason: "provider_error" as const, details: body };
  }

  return { sent: true as const };
}

export async function sendPaymentValidatedAdminNotice(params: {
  companyName: string;
  customerEmail: string;
  serviceName: string;
  planName: string;
  amountCents: number;
  validatedAtIso: string;
  nextDueDateIso: string;
  customerEmailSent: boolean;
  customerEmailFailureReason?: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { sent: false as const, reason: "missing_resend_api_key" as const };
  }

  const to = getBillingValidationAuditToEmail().trim().toLowerCase();
  if (!to) {
    return { sent: false as const, reason: "missing_recipient" as const };
  }

  const validatedAtText = new Date(params.validatedAtIso).toLocaleDateString("es-CL");
  const nextDueDateText = new Date(params.nextDueDateIso).toLocaleDateString("es-CL");
  const amountBase = Math.floor((params.amountCents ?? 0) / 100);
  const ivaAmount = Math.round(amountBase * 0.19);
  const amountTotal = amountBase + ivaAmount;
  const amountBaseText = `$${amountBase.toLocaleString("es-CL")} CLP`;
  const ivaAmountText = `$${ivaAmount.toLocaleString("es-CL")} CLP`;
  const amountTotalText = `$${amountTotal.toLocaleString("es-CL")} CLP`;
  const safeCompanyName = escapeHtml(params.companyName);
  const safeCustomerEmail = escapeHtml(params.customerEmail);
  const safeServiceName = escapeHtml(params.serviceName);
  const safePlanName = escapeHtml(params.planName);
  const customerStatus = params.customerEmailSent ? "ENVIADO" : `FALLIDO (${params.customerEmailFailureReason ?? "unknown"})`;

  let response: Response;
  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: getBillingValidationFromEmail(),
        to: [to],
        reply_to: getBillingValidationReplyToEmail(),
        subject: `Confirmación interna - correo de validación (${safeCompanyName})`,
        html: `
          <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.6">
            <p>Correo de verificación procesado para cliente <strong>${safeCompanyName}</strong>.</p>
            <ul>
              <li>Email cliente: ${safeCustomerEmail}</li>
              <li>Estado correo cliente: ${customerStatus}</li>
              <li>Servicio: ${safeServiceName}</li>
              <li>Plan: ${safePlanName}</li>
              <li>Monto validado: ${amountBaseText} + IVA (19%: ${ivaAmountText}) = ${amountTotalText}</li>
              <li>Fecha validación: ${validatedAtText}</li>
              <li>Próximo cobro: ${nextDueDateText}</li>
            </ul>
          </div>
        `,
      }),
    });
  } catch (error) {
    return {
      sent: false as const,
      reason: "provider_network_error" as const,
      details: error instanceof Error ? error.message : "unknown_error",
    };
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    return { sent: false as const, reason: "provider_error" as const, details: body };
  }

  return { sent: true as const };
}

export async function sendBillingInvoiceEmail(params: {
  to: string;
  companyName: string;
  serviceName: string;
  planName: string;
  fileName: string;
  fileContentBase64: string;
  note?: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { sent: false as const, reason: "missing_resend_api_key" as const };
  }

  const to = params.to.trim().toLowerCase();
  if (!to) {
    return { sent: false as const, reason: "missing_recipient" as const };
  }

  const safeCompanyName = escapeHtml(params.companyName);
  const safeServiceName = escapeHtml(params.serviceName);
  const safePlanName = escapeHtml(params.planName);
  const safeNote = params.note?.trim() ? `<p>${escapeHtml(params.note.trim())}</p>` : "";

  let response: Response;
  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: getBillingInvoiceFromEmail(),
        to: [to],
        reply_to: getBillingInvoiceReplyToEmail(),
        subject: `Boleta de servicio - ${safeCompanyName}`,
        html: `
          <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.6">
            <p>Hola ${safeCompanyName},</p>
            <p>Te compartimos la boleta correspondiente a tu servicio.</p>
            <ul>
              <li>Servicio: ${safeServiceName}</li>
              <li>Plan: ${safePlanName}</li>
            </ul>
            ${safeNote}
            <p>Adjunto encontrarás el PDF de la boleta.</p>
            <p>Equipo Kumera</p>
          </div>
        `,
        attachments: [
          {
            filename: params.fileName,
            content: params.fileContentBase64,
          },
        ],
      }),
    });
  } catch (error) {
    return {
      sent: false as const,
      reason: "provider_network_error" as const,
      details: error instanceof Error ? error.message : "unknown_error",
    };
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    return { sent: false as const, reason: "provider_error" as const, details: body };
  }

  return { sent: true as const };
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
