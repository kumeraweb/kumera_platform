import { requireAdminApi, ROLE } from "@/lib/auth";
import { sendBillingInvoiceEmail, writeBillingAuditLog } from "@/lib/billing";
import { createBillingServiceClient } from "@/lib/db";
import { fail, ok } from "@/lib/http";

const MAX_INVOICE_BYTES = 8 * 1024 * 1024;

function normalizeFileName(rawName: string | null) {
  const fallback = `boleta-${Date.now()}.pdf`;
  if (!rawName) return fallback;
  const safe = rawName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return safe.toLowerCase().endsWith(".pdf") ? safe : `${safe}.pdf`;
}

export async function POST(request: Request, context: { params: Promise<{ subscriptionId: string }> }) {
  const auth = await requireAdminApi([ROLE.BILLING]);
  if (!auth.ok) return auth.response;

  const { subscriptionId } = await context.params;
  const formData = await request.formData().catch(() => null);
  if (!formData) return fail("Invalid form payload", 400);

  const fileValue = formData.get("invoice_pdf");
  if (!(fileValue instanceof File)) {
    return fail("Debes adjuntar una boleta en PDF.", 400);
  }

  if (fileValue.size === 0) {
    return fail("El archivo está vacío.", 400);
  }
  if (fileValue.size > MAX_INVOICE_BYTES) {
    return fail("La boleta supera el máximo permitido de 8MB.", 400);
  }
  if (fileValue.type !== "application/pdf") {
    return fail("Solo se permiten archivos PDF.", 400);
  }

  const noteRaw = formData.get("note");
  const note = typeof noteRaw === "string" ? noteRaw.trim().slice(0, 1000) : "";
  const billing = createBillingServiceClient();

  const { data: subscription, error: subscriptionError } = await billing
    .from("subscriptions")
    .select(`
      id,
      companies(legal_name,email),
      services(name),
      plans(name)
    `)
    .eq("id", subscriptionId)
    .maybeSingle();

  if (subscriptionError) return fail(subscriptionError.message, 500);
  if (!subscription) return fail("Suscripción no encontrada.", 404);

  const companyData = Array.isArray(subscription.companies) ? subscription.companies[0] : subscription.companies;
  const serviceData = Array.isArray(subscription.services) ? subscription.services[0] : subscription.services;
  const planData = Array.isArray(subscription.plans) ? subscription.plans[0] : subscription.plans;

  const recipientEmail = companyData?.email?.trim().toLowerCase();
  if (!recipientEmail) {
    return fail("La empresa no tiene email registrado para enviar boleta.", 400);
  }

  const fileBuffer = Buffer.from(await fileValue.arrayBuffer());
  const fileContentBase64 = fileBuffer.toString("base64");
  const fileName = normalizeFileName(fileValue.name);

  const sendResult = await sendBillingInvoiceEmail({
    to: recipientEmail,
    companyName: companyData?.legal_name ?? "cliente",
    serviceName: serviceData?.name ?? "Servicio Kumera",
    planName: planData?.name ?? "Plan",
    fileName,
    fileContentBase64,
    note,
  });

  if (!sendResult.sent) {
    await writeBillingAuditLog("billing.invoice.email_failed", auth.user.id, {
      subscriptionId,
      recipientEmail,
      reason: sendResult.reason,
      details: "details" in sendResult ? sendResult.details ?? null : null,
    });
    return fail("No se pudo enviar la boleta por correo.", 502);
  }

  await writeBillingAuditLog("billing.invoice.email_sent", auth.user.id, {
    subscriptionId,
    recipientEmail,
    fileName,
    fileSizeBytes: fileValue.size,
    hasNote: Boolean(note),
  });

  return ok({
    sent: true,
    recipientEmail,
  });
}
