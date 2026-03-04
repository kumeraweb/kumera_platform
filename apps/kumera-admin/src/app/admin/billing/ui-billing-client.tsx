"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Service = { id: string; slug: string; name: string };
type Plan = { id: string; service_id: string; name: string; price_cents: number; billing_cycle_days: number };
type ContractTemplate = {
  id: string;
  service_id: string;
  name: string;
  version: string;
  status: "draft" | "active" | "archived";
  target_customer_type: "company" | "person" | "any";
  variables_schema: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};
type PaymentRow = {
  id: string;
  status: string;
  onboarding_state?: "pending_contract_signature" | "pending_transfer_proof" | "ready_for_review" | "completed" | "renewal_pending_payment" | "rejected";
  amount_cents: number;
  due_date: string;
  validated_at: string | null;
  rejection_reason: string | null;
  subscription_id: string;
  latest_proof?: {
    id: string;
    file_path: string;
    mime_type: string;
    size_bytes: number;
    created_at: string;
  } | null;
  subscriptions?: {
    companies?: { legal_name?: string | null };
    services?: { name?: string | null };
    plans?: { name?: string | null };
  } | null;
};
type SubscriptionRow = {
  id: string;
  status: string;
  created_at: string;
  next_due_date?: string | null;
  has_pending_payment?: boolean;
  next_payment_id?: string | null;
  companies?: { legal_name?: string | null; email?: string | null };
  services?: { slug?: string | null; name?: string | null };
  plans?: { id?: string | null; name?: string | null; price_cents?: number | null };
};
type BillingSection = "onboarding" | "templates" | "payments" | "clients";

type Props = { legacyAdminUrl: string };
const PLATFORM_SERVICE_SLUGS = new Set(["tractiva", "tuejecutiva", "leadosku"]);

function composeRut(bodyRaw: string, dvRaw: string) {
  const body = bodyRaw.replace(/\D/g, "");
  const dv = dvRaw.replace(/[^0-9kK]/g, "").toUpperCase();
  if (!body || !dv) return "";
  return `${body}-${dv}`;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    validated: "badge-success",
    active: "badge-success",
    paid: "badge-success",
    completed: "badge-success",
    ready_for_review: "badge-warning",
    pending_transfer_proof: "badge-warning",
    pending_contract_signature: "badge-neutral",
    renewal_pending_payment: "badge-neutral",
    pending: "badge-warning",
    pending_onboarding: "badge-warning",
    draft: "badge-neutral",
    rejected: "badge-error",
    suspended: "badge-warning",
    cancelled: "badge-error",
    archived: "badge-neutral",
  };
  const cls = map[status] ?? "badge-neutral";
  return <span className={`badge ${cls}`}>{status}</span>;
}

export default function BillingAdminClient({ legacyAdminUrl }: Props) {
  const [services, setServices] = useState<Service[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [onboardingUrl, setOnboardingUrl] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    htmlRendered: string;
    contentHash: string;
    serviceName: string;
    planName: string;
    templateName: string;
  } | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFormSnapshot, setPreviewFormSnapshot] = useState<string | null>(null);
  const [proofPreviewByPaymentId, setProofPreviewByPaymentId] = useState<Record<string, string>>({});
  const [section, setSection] = useState<BillingSection>("onboarding");
  const [clientServiceFilter, setClientServiceFilter] = useState<string>("all");
  const [invoiceModalSubscription, setInvoiceModalSubscription] = useState<SubscriptionRow | null>(null);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [invoiceNote, setInvoiceNote] = useState("");

  const [form, setForm] = useState({
    customerType: "company" as "company" | "person",
    companyName: "",
    rutBody: "",
    rutDv: "",
    address: "",
    email: "",
    phone: "",
    legalRepresentativeName: "",
    legalRepresentativeRutBody: "",
    legalRepresentativeRutDv: "",
    serviceSlug: "",
    planMode: "catalog" as "catalog" | "custom",
    planId: "",
    customPlanName: "",
    customAmountClp: "",
    contractTemplateId: "",
    taxDocumentType: "factura",
  });

  const platformServices = useMemo(
    () => services.filter((service) => PLATFORM_SERVICE_SLUGS.has(service.slug)),
    [services],
  );

  const plansForService = useMemo(() => {
    const selectedService = platformServices.find((service) => service.slug === form.serviceSlug);
    if (!selectedService) return [];
    return plans.filter((plan) => plan.service_id === selectedService.id);
  }, [form.serviceSlug, plans, platformServices]);
  const templatesForService = useMemo(() => {
    const selectedService = platformServices.find((service) => service.slug === form.serviceSlug);
    if (!selectedService) return [];
    return templates.filter(
      (template) =>
        template.service_id === selectedService.id &&
        template.status === "active" &&
        (template.target_customer_type === "any" || template.target_customer_type === form.customerType),
    );
  }, [form.customerType, form.serviceSlug, platformServices, templates]);
  const currentFormSnapshot = useMemo(() => JSON.stringify(form), [form]);
  const renewalPendingPayments = useMemo(
    () =>
      payments.filter(
        (payment) =>
          payment.status === "pending" && payment.onboarding_state === "renewal_pending_payment",
      ),
    [payments],
  );
  const pendingPayments = useMemo(
    () =>
      payments.filter(
        (payment) =>
          !["validated", "rejected"].includes(payment.status) &&
          payment.onboarding_state !== "renewal_pending_payment",
      ),
    [payments],
  );
  const rejectedPayments = useMemo(
    () => payments.filter((payment) => payment.status === "rejected"),
    [payments],
  );
  const validatedPayments = useMemo(
    () => payments.filter((payment) => payment.status === "validated"),
    [payments],
  );
  const clientServiceOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const subscription of subscriptions) {
      const slug = subscription.services?.slug?.trim();
      if (!slug) continue;
      const label = subscription.services?.name?.trim() || slug;
      map.set(slug, label);
    }
    return Array.from(map.entries())
      .map(([slug, label]) => ({ slug, label }))
      .sort((a, b) => a.label.localeCompare(b.label, "es"));
  }, [subscriptions]);
  const filteredSubscriptions = useMemo(
    () =>
      subscriptions.filter((subscription) => {
        if (clientServiceFilter === "all") return true;
        return subscription.services?.slug === clientServiceFilter;
      }),
    [clientServiceFilter, subscriptions],
  );
  const activeSubscriptions = useMemo(
    () => filteredSubscriptions.filter((subscription) => subscription.status === "active"),
    [filteredSubscriptions],
  );
  const inactiveSubscriptions = useMemo(
    () => filteredSubscriptions.filter((subscription) => subscription.status === "suspended" || subscription.status === "cancelled"),
    [filteredSubscriptions],
  );

  async function loadAll() {
    setLoading(true);
    setError(null);

    const [catalogRes, paymentsRes, subsRes] = await Promise.all([
      fetch("/api/admin/billing/catalog", { cache: "no-store" }),
      fetch("/api/admin/billing/payments", { cache: "no-store" }),
      fetch("/api/admin/billing/subscriptions", { cache: "no-store" }),
    ]);

    const [catalogPayload, paymentsPayload, subsPayload] = await Promise.all([
      catalogRes.json(),
      paymentsRes.json(),
      subsRes.json(),
    ]);

    if (!catalogRes.ok) {
      setError(catalogPayload.error ?? "No se pudo cargar catálogo");
      setLoading(false);
      return;
    }
    if (!paymentsRes.ok) {
      setError(paymentsPayload.error ?? "No se pudo cargar pagos");
      setLoading(false);
      return;
    }
    if (!subsRes.ok) {
      setError(subsPayload.error ?? "No se pudo cargar suscripciones");
      setLoading(false);
      return;
    }

    setServices(catalogPayload.services ?? []);
    setPlans(catalogPayload.plans ?? []);
    setTemplates(catalogPayload.templates ?? []);
    setPayments(paymentsPayload.payments ?? []);
    setSubscriptions(subsPayload.subscriptions ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void loadAll();
  }, []);

  useEffect(() => {
    if (!form.serviceSlug && platformServices.length > 0) {
      setForm((prev) => ({ ...prev, serviceSlug: platformServices[0].slug }));
    }
  }, [form.serviceSlug, platformServices]);

  useEffect(() => {
    if (
      form.planMode === "catalog" &&
      plansForService.length > 0 &&
      !plansForService.some((plan) => plan.id === form.planId)
    ) {
      setForm((prev) => ({ ...prev, planId: plansForService[0].id }));
    }
  }, [form.planId, form.planMode, plansForService]);
  useEffect(() => {
    if (templatesForService.length > 0 && !templatesForService.some((template) => template.id === form.contractTemplateId)) {
      setForm((prev) => ({ ...prev, contractTemplateId: templatesForService[0].id }));
    }
  }, [form.contractTemplateId, templatesForService]);

  function validateOnboardingForm() {
    if (!form.serviceSlug) return "Debes seleccionar un servicio.";
    if (form.planMode === "catalog" && !form.planId) return "Debes seleccionar un plan.";
    if (form.planMode === "custom" && !form.customPlanName.trim()) return "Debes indicar nombre del plan personalizado.";
    if (form.planMode === "custom" && (!form.customAmountClp || Number(form.customAmountClp) <= 0)) {
      return "Debes indicar monto válido para el plan personalizado.";
    }
    if (!form.contractTemplateId) {
      return "Debes seleccionar una plantilla de contrato. Si no aparecen, falta ejecutar migraciones/seed de templates.";
    }
    return null;
  }

  useEffect(() => {
    if (previewFormSnapshot && previewFormSnapshot !== currentFormSnapshot) {
      setPreview(null);
      setPreviewFormSnapshot(null);
    }
  }, [currentFormSnapshot, previewFormSnapshot]);

  async function onPreviewContract() {
    const validationError = validateOnboardingForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setWorking(true);
    setError(null);
    setMessage(null);

    const response = await fetch("/api/admin/billing/onboarding/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        planId: form.planMode === "catalog" ? form.planId : undefined,
        customPlanName: form.planMode === "custom" ? form.customPlanName.trim() : undefined,
        customAmountClp: form.planMode === "custom" ? Number(form.customAmountClp) : undefined,
        rut: composeRut(form.rutBody, form.rutDv),
        legalRepresentativeRut: composeRut(form.legalRepresentativeRutBody, form.legalRepresentativeRutDv),
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "No se pudo previsualizar contrato");
      setWorking(false);
      return;
    }

    setPreview({
      htmlRendered: payload.contract?.htmlRendered ?? "",
      contentHash: payload.contract?.contentHash ?? "",
      serviceName: payload.service?.name ?? "-",
      planName: payload.plan?.name ?? "-",
      templateName: payload.template?.name ?? "-",
    });
    setPreviewOpen(true);
    setPreviewFormSnapshot(currentFormSnapshot);
    setMessage("Previsualización lista. Ya puedes crear onboarding.");
    setWorking(false);
  }
  async function onCreateOnboarding(event: FormEvent) {
    event.preventDefault();
    const validationError = validateOnboardingForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    const companyRut = composeRut(form.rutBody, form.rutDv);
    const representativeRut = composeRut(form.legalRepresentativeRutBody, form.legalRepresentativeRutDv);
    if (!companyRut) {
      setError("Debes ingresar RUT y DV del cliente.");
      return;
    }
    if (form.customerType === "company" && form.legalRepresentativeName.trim() && !representativeRut) {
      setError("Si ingresas representante legal, debes completar su RUT y DV.");
      return;
    }

    if (previewFormSnapshot !== currentFormSnapshot || !preview) {
      setError("Debes previsualizar el contrato antes de crear onboarding.");
      return;
    }

    setWorking(true);
    setError(null);
    setMessage(null);
    setOnboardingUrl(null);
    setPaymentUrl(null);

    const response = await fetch("/api/admin/billing/onboarding/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        planId: form.planMode === "catalog" ? form.planId : undefined,
        customPlanName: form.planMode === "custom" ? form.customPlanName.trim() : undefined,
        customAmountClp: form.planMode === "custom" ? Number(form.customAmountClp) : undefined,
        rut: companyRut,
        legalRepresentativeRut: representativeRut,
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "No se pudo crear onboarding");
      setWorking(false);
      return;
    }

    setMessage("Onboarding creado correctamente.");
    setOnboardingUrl(payload.onboardingUrl ?? null);
    setWorking(false);
    await loadAll();
  }

  async function onValidatePayment(id: string) {
    setWorking(true);
    setError(null);
    setMessage(null);

    const response = await fetch(`/api/admin/billing/payments/${id}/validate`, { method: "POST" });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "No se pudo validar pago");
      setWorking(false);
      return;
    }

    setMessage("Pago validado.");
    setWorking(false);
    await loadAll();
  }

  async function onRejectPayment(id: string) {
    const reason = window.prompt("Motivo de rechazo del pago:");
    if (!reason?.trim()) return;

    setWorking(true);
    setError(null);
    setMessage(null);

    const response = await fetch(`/api/admin/billing/payments/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: reason.trim() }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "No se pudo rechazar pago");
      setWorking(false);
      return;
    }

    setMessage("Pago rechazado.");
    setWorking(false);
    await loadAll();
  }

  async function onDeleteRejectedPayment(id: string) {
    const confirmed = window.confirm("Esto eliminará definitivamente el onboarding rechazado (cliente/suscripción). ¿Continuar?");
    if (!confirmed) return;

    setWorking(true);
    setError(null);
    setMessage(null);

    const response = await fetch(`/api/admin/billing/payments/${id}/delete`, {
      method: "DELETE",
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "No se pudo eliminar definitivamente");
      setWorking(false);
      return;
    }

    setMessage("Registro rechazado eliminado definitivamente.");
    setWorking(false);
    await loadAll();
  }

  async function onRegenerateToken(subscriptionId: string) {
    setWorking(true);
    setError(null);
    setMessage(null);
    setOnboardingUrl(null);

    const response = await fetch(`/api/admin/billing/onboarding/${subscriptionId}/regenerate-token`, {
      method: "POST",
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "No se pudo regenerar token");
      setWorking(false);
      return;
    }

    setMessage(payload.renewed ? "Token renovado." : "Token regenerado.");
    setOnboardingUrl(payload.onboardingUrl ?? null);
    setWorking(false);
  }

  async function onGeneratePaymentLink(subscriptionId: string) {
    setWorking(true);
    setError(null);
    setMessage(null);
    setOnboardingUrl(null);
    setPaymentUrl(null);

    const response = await fetch(`/api/admin/billing/subscriptions/${subscriptionId}/payment-link`, {
      method: "POST",
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "No se pudo generar link de pago");
      setWorking(false);
      return;
    }

    setMessage("Link de pago generado.");
    setPaymentUrl(payload.paymentUrl ?? null);
    setWorking(false);
  }

  async function onOpenProofPreview(paymentId: string) {
    if (proofPreviewByPaymentId[paymentId]) return;
    setWorking(true);
    setError(null);
    const response = await fetch(`/api/admin/billing/payments/${paymentId}/proof`, { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "No se pudo abrir preview de comprobante");
      setWorking(false);
      return;
    }
    const url = payload?.proof?.signed_url as string | undefined;
    if (url) {
      setProofPreviewByPaymentId((prev) => ({ ...prev, [paymentId]: url }));
    }
    setWorking(false);
  }

  function onOpenInvoiceModal(subscription: SubscriptionRow) {
    setError(null);
    setInvoiceFile(null);
    setInvoiceNote("");
    setInvoiceModalSubscription(subscription);
  }

  function onCloseInvoiceModal() {
    if (working) return;
    setInvoiceModalSubscription(null);
    setInvoiceFile(null);
    setInvoiceNote("");
  }

  async function onSendInvoice() {
    if (!invoiceModalSubscription) return;
    if (!invoiceFile) {
      setError("Debes adjuntar una boleta PDF antes de enviar.");
      return;
    }

    setWorking(true);
    setError(null);
    setMessage(null);

    const formData = new FormData();
    formData.set("invoice_pdf", invoiceFile);
    if (invoiceNote.trim()) {
      formData.set("note", invoiceNote.trim());
    }

    const response = await fetch(`/api/admin/billing/subscriptions/${invoiceModalSubscription.id}/invoice`, {
      method: "POST",
      body: formData,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(payload.error ?? "No se pudo enviar la boleta.");
      setWorking(false);
      return;
    }

    setMessage(`Boleta enviada a ${payload.recipientEmail ?? "cliente"}.`);
    setWorking(false);
    onCloseInvoiceModal();
  }

  async function onUpdateSubscriptionStatus(subscriptionId: string, status: "active" | "suspended") {
    const confirmMessage =
      status === "suspended"
        ? "¿Dar de baja este cliente? Se conservará el historial y podrás reactivarlo luego."
        : "¿Reactivar este cliente?";
    const confirmed = window.confirm(confirmMessage);
    if (!confirmed) return;

    let reason: string | undefined;
    if (status === "suspended") {
      const input = window.prompt("Motivo de baja (opcional):");
      reason = input?.trim() || undefined;
    }

    setWorking(true);
    setError(null);
    setMessage(null);

    const response = await fetch(`/api/admin/billing/subscriptions/${subscriptionId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, reason }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(payload.error ?? "No se pudo actualizar el estado de la suscripción.");
      setWorking(false);
      return;
    }

    setMessage(status === "suspended" ? "Cliente dado de baja correctamente." : "Cliente reactivado correctamente.");
    setWorking(false);
    await loadAll();
  }

  return (
    <div className="grid gap-5">
      {/* Page header */}
      <div>
        <h1 className="section-title" style={{ fontSize: 20 }}>Billing</h1>
        <p className="section-desc">Onboarding de clientes, pagos y suscripciones.</p>
      </div>

      <div className="admin-card">
        <div className="flex flex-wrap items-center gap-2">
          <button className={`admin-btn admin-btn-sm ${section === "onboarding" ? "admin-btn-primary" : "admin-btn-secondary"}`} onClick={() => setSection("onboarding")} type="button">Onboarding</button>
          <button className={`admin-btn admin-btn-sm ${section === "templates" ? "admin-btn-primary" : "admin-btn-secondary"}`} onClick={() => setSection("templates")} type="button">Plantillas</button>
          <button className={`admin-btn admin-btn-sm ${section === "payments" ? "admin-btn-primary" : "admin-btn-secondary"}`} onClick={() => setSection("payments")} type="button">Pagos</button>
          <button className={`admin-btn admin-btn-sm ${section === "clients" ? "admin-btn-primary" : "admin-btn-secondary"}`} onClick={() => setSection("clients")} type="button">Clientes</button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-lg border p-3" style={{ borderColor: "var(--admin-border)" }}>
            <p className="m-0 text-xs" style={{ color: "var(--admin-text-muted)" }}>Pagos pendientes</p>
            <p className="m-0 mt-1 text-lg font-semibold">{pendingPayments.length}</p>
          </div>
          <div className="rounded-lg border p-3" style={{ borderColor: "var(--admin-border)" }}>
            <p className="m-0 text-xs" style={{ color: "var(--admin-text-muted)" }}>Renovaciones por cobrar</p>
            <p className="m-0 mt-1 text-lg font-semibold">{renewalPendingPayments.length}</p>
          </div>
          <div className="rounded-lg border p-3" style={{ borderColor: "var(--admin-border)" }}>
            <p className="m-0 text-xs" style={{ color: "var(--admin-text-muted)" }}>Pagos rechazados</p>
            <p className="m-0 mt-1 text-lg font-semibold">{rejectedPayments.length}</p>
          </div>
          <div className="rounded-lg border p-3" style={{ borderColor: "var(--admin-border)" }}>
            <p className="m-0 text-xs" style={{ color: "var(--admin-text-muted)" }}>Pagos validados</p>
            <p className="m-0 mt-1 text-lg font-semibold">{validatedPayments.length}</p>
          </div>
          <div className="rounded-lg border p-3" style={{ borderColor: "var(--admin-border)" }}>
            <p className="m-0 text-xs" style={{ color: "var(--admin-text-muted)" }}>Clientes activos</p>
            <p className="m-0 mt-1 text-lg font-semibold">{subscriptions.filter((subscription) => subscription.status === "active").length}</p>
          </div>
        </div>
      </div>

      {/* Global alerts */}
      {error ? <div className="admin-alert admin-alert-error">{error}</div> : null}
      {message ? <div className="admin-alert admin-alert-success">{message}</div> : null}
      {onboardingUrl ? (
        <div className="admin-alert admin-alert-info">
          <div>
            <p className="m-0 text-xs font-semibold">Link onboarding generado</p>
            <p className="m-0 mt-1 break-all text-xs">{onboardingUrl}</p>
          </div>
        </div>
      ) : null}
      {paymentUrl ? (
        <div className="admin-alert admin-alert-info">
          <div>
            <p className="m-0 text-xs font-semibold">Link de pago generado</p>
            <p className="m-0 mt-1 break-all text-xs">{paymentUrl}</p>
          </div>
        </div>
      ) : null}

      {section === "onboarding" ? (
      <>
      {/* ─── Crear onboarding ─── */}
      <div className="admin-card">
        <h2 className="section-title">Crear onboarding</h2>
        <p className="section-desc">Crea empresa + suscripción + token + primer pago pendiente.</p>

        <form className="mt-5 grid gap-4" onSubmit={onCreateOnboarding}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="admin-field">
              <label className="admin-label">Tipo cliente</label>
              <select className="admin-input" value={form.customerType} onChange={(e) => setForm((v) => ({ ...v, customerType: e.target.value as "company" | "person", contractTemplateId: "" }))} required>
                <option value="company">Empresa</option>
                <option value="person">Persona natural</option>
              </select>
            </div>
            <div className="admin-field">
              <label className="admin-label">{form.customerType === "company" ? "Razón social" : "Nombre completo"}</label>
              <input className="admin-input" placeholder={form.customerType === "company" ? "Razón social" : "Nombre completo"} value={form.companyName} onChange={(e) => setForm((v) => ({ ...v, companyName: e.target.value }))} required />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-[3fr_1fr]">
            <div className="admin-field">
              <label className="admin-label">RUT</label>
              <input className="admin-input" placeholder="Solo números" value={form.rutBody} onChange={(e) => setForm((v) => ({ ...v, rutBody: e.target.value.replace(/\\D/g, "") }))} required />
            </div>
            <div className="admin-field">
              <label className="admin-label">DV</label>
              <input className="admin-input" placeholder="DV" maxLength={1} value={form.rutDv} onChange={(e) => setForm((v) => ({ ...v, rutDv: e.target.value.replace(/[^0-9kK]/g, "").toUpperCase() }))} required />
            </div>
          </div>

          {form.customerType === "company" ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="admin-field">
                <label className="admin-label">Representante legal (opcional)</label>
                <input className="admin-input" placeholder="Nombre completo" value={form.legalRepresentativeName} onChange={(e) => setForm((v) => ({ ...v, legalRepresentativeName: e.target.value }))} />
              </div>
              <div className="grid gap-4 md:grid-cols-[3fr_1fr]">
                <div className="admin-field">
                  <label className="admin-label">RUT representante</label>
                  <input className="admin-input" placeholder="Solo números" value={form.legalRepresentativeRutBody} onChange={(e) => setForm((v) => ({ ...v, legalRepresentativeRutBody: e.target.value.replace(/\\D/g, "") }))} />
                </div>
                <div className="admin-field">
                  <label className="admin-label">DV</label>
                  <input className="admin-input" placeholder="DV" maxLength={1} value={form.legalRepresentativeRutDv} onChange={(e) => setForm((v) => ({ ...v, legalRepresentativeRutDv: e.target.value.replace(/[^0-9kK]/g, "").toUpperCase() }))} />
                </div>
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-3">
            <div className="admin-field">
              <label className="admin-label">Dirección</label>
              <input className="admin-input" placeholder="Dirección" value={form.address} onChange={(e) => setForm((v) => ({ ...v, address: e.target.value }))} required />
            </div>
            <div className="admin-field">
              <label className="admin-label">Email</label>
              <input className="admin-input" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm((v) => ({ ...v, email: e.target.value }))} required />
            </div>
            <div className="admin-field">
              <label className="admin-label">Teléfono</label>
              <input className="admin-input" placeholder="Teléfono" value={form.phone} onChange={(e) => setForm((v) => ({ ...v, phone: e.target.value }))} required />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div className="admin-field">
              <label className="admin-label">Servicio Kumera</label>
              <select className="admin-input" value={form.serviceSlug} onChange={(e) => setForm((v) => ({ ...v, serviceSlug: e.target.value, planId: "", contractTemplateId: "" }))} required>
                <option value="">Seleccionar…</option>
                {platformServices.map((service) => (
                  <option key={service.id} value={service.slug}>{service.name} ({service.slug})</option>
                ))}
              </select>
            </div>
            <div className="admin-field">
              <label className="admin-label">Modo de plan</label>
              <select
                className="admin-input"
                value={form.planMode}
                onChange={(e) =>
                  setForm((v) => ({
                    ...v,
                    planMode: e.target.value as "catalog" | "custom",
                    planId: e.target.value === "catalog" ? v.planId : "",
                    customPlanName: e.target.value === "custom" ? v.customPlanName : "",
                    customAmountClp: e.target.value === "custom" ? v.customAmountClp : "",
                  }))
                }
                required
              >
                <option value="catalog">Plan catálogo</option>
                <option value="custom">Plan personalizado</option>
              </select>
            </div>
            <div className="admin-field">
              <label className="admin-label">Doc. tributario</label>
              <select className="admin-input" value={form.taxDocumentType} onChange={(e) => setForm((v) => ({ ...v, taxDocumentType: e.target.value }))} required>
                <option value="factura">Factura</option>
                <option value="boleta">Boleta</option>
              </select>
            </div>
            <div className="admin-field">
              <label className="admin-label">Plantilla contrato</label>
              <select className="admin-input" value={form.contractTemplateId} onChange={(e) => setForm((v) => ({ ...v, contractTemplateId: e.target.value }))} required>
                <option value="">Seleccionar…</option>
                {templatesForService.map((template) => (
                  <option key={template.id} value={template.id}>{template.name} ({template.version})</option>
                ))}
              </select>
            </div>
          </div>

          {form.planMode === "catalog" ? (
            <div className="admin-field">
              <label className="admin-label">Plan</label>
              <select className="admin-input" value={form.planId} onChange={(e) => setForm((v) => ({ ...v, planId: e.target.value }))} required>
                <option value="">Seleccionar…</option>
                {plansForService.map((plan) => (
                  <option key={plan.id} value={plan.id}>{plan.name} · ${Math.floor(plan.price_cents / 100)}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="admin-field">
                <label className="admin-label">Nombre plan personalizado</label>
                <input
                  className="admin-input"
                  placeholder="Ej: Tractiva personalizado"
                  value={form.customPlanName}
                  onChange={(e) => setForm((v) => ({ ...v, customPlanName: e.target.value }))}
                  required
                />
              </div>
              <div className="admin-field">
                <label className="admin-label">Monto mensual (CLP)</label>
                <input
                  className="admin-input"
                  type="number"
                  min={1}
                  step={1}
                  placeholder="Ej: 250000"
                  value={form.customAmountClp}
                  onChange={(e) => setForm((v) => ({ ...v, customAmountClp: e.target.value }))}
                  required
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button disabled={working || loading} className="admin-btn admin-btn-primary" type="submit">
              {working ? "Procesando..." : "Crear onboarding"}
            </button>
            <button disabled={working || loading} className="admin-btn admin-btn-secondary" onClick={onPreviewContract} type="button">
              {working ? "Procesando..." : "Previsualizar contrato"}
            </button>
            {preview ? (
              <button disabled={working} className="admin-btn admin-btn-ghost" onClick={() => setPreviewOpen(true)} type="button">
                Abrir preview
              </button>
            ) : null}
          </div>
        </form>

        {preview ? (
          <p className="mt-4 text-xs" style={{ color: "var(--admin-text-muted)" }}>
            Preview listo: {preview.serviceName} · {preview.planName} · {preview.templateName} · hash{" "}
            <span className="font-mono">{preview.contentHash.slice(0, 16)}</span>
          </p>
        ) : (
          <p className="mt-4 text-xs" style={{ color: "var(--admin-text-muted)" }}>Previsualiza el contrato con los datos actuales antes de generar el token onboarding.</p>
        )}
      </div>

      {/* ─── Preview modal ─── */}
      {previewOpen && preview ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }} role="dialog" aria-modal="true">
          <div
            className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-2xl border"
            style={{ background: "var(--admin-surface)", borderColor: "var(--admin-border)", boxShadow: "0 8px 48px rgba(0,0,0,0.4)" }}
          >
            <div className="flex items-center justify-between gap-2 border-b px-5 py-4" style={{ borderColor: "var(--admin-border)" }}>
              <p className="m-0 text-sm font-semibold" style={{ color: "var(--admin-text)" }}>
                Preview: {preview.serviceName} · {preview.planName} · {preview.templateName}
              </p>
              <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => setPreviewOpen(false)} type="button">
                Cerrar
              </button>
            </div>
            <div className="max-h-[calc(92vh-64px)] overflow-y-auto p-5">
              <p className="mb-3 text-xs" style={{ color: "var(--admin-text-muted)" }}>
                Hash: <span className="font-mono">{preview.contentHash}</span>
              </p>
              <article
                className="prose max-w-none rounded-xl border p-5 text-sm"
                style={{ background: "#ffffff", color: "#0f172a", borderColor: "#d1d5db" }}
                dangerouslySetInnerHTML={{ __html: preview.htmlRendered }}
              />
            </div>
          </div>
        </div>
      ) : null}
      </>
      ) : null}

      {/* ─── Templates table ─── */}
      {section === "templates" ? (
      <div className="admin-card">
        <h2 className="section-title">Plantillas de contrato</h2>
        <p className="section-desc">Plantillas precargadas desde la base de datos.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Servicio</th>
                <th>Nombre</th>
                <th>Versión</th>
                <th>Tipo cliente</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((template) => (
                <tr key={template.id}>
                  <td>{services.find((s) => s.id === template.service_id)?.name ?? template.service_id}</td>
                  <td style={{ fontWeight: 500 }}>{template.name}</td>
                  <td><span className="font-mono text-xs">{template.version}</span></td>
                  <td><span className="badge badge-neutral">{template.target_customer_type}</span></td>
                  <td><StatusBadge status={template.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      ) : null}

      {/* ─── Payments table ─── */}
      {section === "payments" ? (
      <>
      <div className="admin-card">
        <h2 className="section-title">Pagos pendientes</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Servicio</th>
                <th>Plan</th>
                <th>Onboarding</th>
                <th>Estado</th>
                <th>Comprobante</th>
                <th>Monto</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pendingPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-sm" style={{ color: "var(--admin-text-muted)" }}>
                    No hay pagos pendientes.
                  </td>
                </tr>
              ) : (
                pendingPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td style={{ fontWeight: 500 }}>{payment.subscriptions?.companies?.legal_name ?? "-"}</td>
                    <td>{payment.subscriptions?.services?.name ?? "-"}</td>
                    <td>{payment.subscriptions?.plans?.name ?? "-"}</td>
                    <td>
                      <StatusBadge status={payment.onboarding_state ?? "pending_contract_signature"} />
                    </td>
                    <td><StatusBadge status={payment.status} /></td>
                    <td>
                      <div className="flex flex-col gap-2">
                        {payment.latest_proof ? (
                          <>
                            <button
                              className="admin-btn admin-btn-ghost admin-btn-sm"
                              disabled={working}
                              onClick={() => onOpenProofPreview(payment.id)}
                              type="button"
                            >
                              Ver comprobante
                            </button>
                            {proofPreviewByPaymentId[payment.id] ? (
                              <a href={proofPreviewByPaymentId[payment.id]} rel="noreferrer" target="_blank">
                                <img
                                  alt="Comprobante"
                                  src={proofPreviewByPaymentId[payment.id]}
                                  style={{ width: 96, height: 72, objectFit: "cover", borderRadius: 8, border: "1px solid var(--admin-border)" }}
                                />
                              </a>
                            ) : null}
                          </>
                        ) : (
                          <span className="text-xs" style={{ color: "var(--admin-text-muted)" }}>Sin comprobante</span>
                        )}
                      </div>
                    </td>
                    <td className="font-mono">${Math.floor((payment.amount_cents ?? 0) / 100)}</td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        <button
                          disabled={working || payment.status === "validated" || (payment.status === "pending" && !payment.latest_proof)}
                          className="admin-btn admin-btn-success admin-btn-sm"
                          onClick={() => onValidatePayment(payment.id)}
                          type="button"
                          title={payment.status === "pending" && !payment.latest_proof ? "Primero debe existir comprobante de pago." : undefined}
                        >
                          Validar
                        </button>
                        <button disabled={working || payment.status === "rejected"} className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => onRejectPayment(payment.id)} type="button">Rechazar</button>
                        <button
                          disabled={working}
                          className="admin-btn admin-btn-secondary admin-btn-sm"
                          onClick={() => onRegenerateToken(payment.subscription_id)}
                          type="button"
                        >
                          Renovar token
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <details className="admin-card">
        <summary className="cursor-pointer text-sm font-semibold" style={{ color: "var(--admin-text)" }}>
          Renovaciones mensuales (pendiente de pago): {renewalPendingPayments.length}
        </summary>
        <p className="section-desc mt-3">Clientes activos con cuota mensual pendiente. Aquí no hay re-firma de contrato y aquí se reenvía el link de pago mensual.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Servicio</th>
                <th>Plan</th>
                <th>Fecha renovación</th>
                <th>Estado</th>
                <th>Comprobante</th>
                <th>Monto</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {renewalPendingPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-sm" style={{ color: "var(--admin-text-muted)" }}>
                    No hay renovaciones pendientes.
                  </td>
                </tr>
              ) : (
                renewalPendingPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td style={{ fontWeight: 500 }}>{payment.subscriptions?.companies?.legal_name ?? "-"}</td>
                    <td>{payment.subscriptions?.services?.name ?? "-"}</td>
                    <td>{payment.subscriptions?.plans?.name ?? "-"}</td>
                    <td>
                      {payment.due_date ? (
                        (() => {
                          const dueDate = new Date(payment.due_date);
                          const startToday = new Date();
                          startToday.setHours(0, 0, 0, 0);
                          const startDue = new Date(dueDate);
                          startDue.setHours(0, 0, 0, 0);
                          const days = Math.ceil((startDue.getTime() - startToday.getTime()) / (1000 * 60 * 60 * 24));
                          const isOverdue = days < 0;
                          const isSoon = days >= 0 && days <= 7;
                          const color = isOverdue
                            ? "#ef4444"
                            : isSoon
                              ? "#f59e0b"
                              : "var(--admin-text)";
                          const weight = isOverdue || isSoon ? 700 : 500;
                          return (
                            <span style={{ color, fontWeight: weight }}>
                              {dueDate.toLocaleDateString("es-CL")}
                            </span>
                          );
                        })()
                      ) : (
                        "-"
                      )}
                    </td>
                    <td><StatusBadge status={payment.status} /></td>
                    <td>
                      {payment.latest_proof ? (
                        <button
                          className="admin-btn admin-btn-ghost admin-btn-sm"
                          disabled={working}
                          onClick={() => onOpenProofPreview(payment.id)}
                          type="button"
                        >
                          Ver comprobante
                        </button>
                      ) : (
                        <span className="text-xs" style={{ color: "var(--admin-text-muted)" }}>Sin comprobante</span>
                      )}
                    </td>
                    <td className="font-mono">${Math.floor((payment.amount_cents ?? 0) / 100)}</td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        <button
                          disabled={working || (payment.status === "pending" && !payment.latest_proof)}
                          className="admin-btn admin-btn-success admin-btn-sm"
                          onClick={() => onValidatePayment(payment.id)}
                          type="button"
                          title={payment.status === "pending" && !payment.latest_proof ? "Primero debe existir comprobante de pago." : undefined}
                        >
                          Validar
                        </button>
                        <button
                          disabled={working}
                          className="admin-btn admin-btn-primary admin-btn-sm"
                          onClick={() => onGeneratePaymentLink(payment.subscription_id)}
                          type="button"
                        >
                          Reenviar link pago
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </details>

      <details className="admin-card">
        <summary className="cursor-pointer text-sm font-semibold" style={{ color: "var(--admin-text)" }}>
          Pagos rechazados: {rejectedPayments.length}
        </summary>
        <div className="mt-4 overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Servicio</th>
                <th>Plan</th>
                <th>Motivo</th>
                <th>Monto</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {rejectedPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm" style={{ color: "var(--admin-text-muted)" }}>
                    No hay pagos rechazados.
                  </td>
                </tr>
              ) : (
                rejectedPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td style={{ fontWeight: 500 }}>{payment.subscriptions?.companies?.legal_name ?? "-"}</td>
                    <td>{payment.subscriptions?.services?.name ?? "-"}</td>
                    <td>{payment.subscriptions?.plans?.name ?? "-"}</td>
                    <td>{payment.rejection_reason ?? "-"}</td>
                    <td className="font-mono">${Math.floor((payment.amount_cents ?? 0) / 100)}</td>
                    <td>
                      <button
                        disabled={working}
                        className="admin-btn admin-btn-danger admin-btn-sm"
                        onClick={() => onDeleteRejectedPayment(payment.id)}
                        type="button"
                      >
                        Eliminar definitivamente
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </details>

      <details className="admin-card">
        <summary className="cursor-pointer text-sm font-semibold" style={{ color: "var(--admin-text)" }}>
          Pagos validados (histórico): {validatedPayments.length}
        </summary>
        <div className="mt-4 overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Servicio</th>
                <th>Plan</th>
                <th>Fecha validación</th>
                <th>Monto</th>
              </tr>
            </thead>
            <tbody>
              {validatedPayments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm" style={{ color: "var(--admin-text-muted)" }}>
                    No hay pagos validados.
                  </td>
                </tr>
              ) : (
                validatedPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td style={{ fontWeight: 500 }}>{payment.subscriptions?.companies?.legal_name ?? "-"}</td>
                    <td>{payment.subscriptions?.services?.name ?? "-"}</td>
                    <td>{payment.subscriptions?.plans?.name ?? "-"}</td>
                    <td>{payment.validated_at ? new Date(payment.validated_at).toLocaleString("es-CL") : "-"}</td>
                    <td className="font-mono">${Math.floor((payment.amount_cents ?? 0) / 100)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </details>
      </>
      ) : null}

      {/* ─── Subscriptions table ─── */}
      {section === "clients" ? (
      <div className="admin-card">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="section-title">Clientes onboardeados</h2>
            <p className="section-desc">Activos arriba. Suspendidos/cancelados en listado desplegable.</p>
          </div>
          <a className="admin-btn admin-btn-ghost admin-btn-sm" href={legacyAdminUrl} rel="noreferrer" target="_blank">Legacy admin ↗</a>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="admin-field md:col-span-1">
            <label className="admin-label">Filtrar por servicio</label>
            <select className="admin-input" value={clientServiceFilter} onChange={(e) => setClientServiceFilter(e.target.value)}>
              <option value="all">Todos los servicios</option>
              {clientServiceOptions.map((serviceOption) => (
                <option key={serviceOption.slug} value={serviceOption.slug}>
                  {serviceOption.label} ({serviceOption.slug})
                </option>
              ))}
            </select>
          </div>
          <div className="rounded-lg border p-3 md:col-span-2" style={{ borderColor: "var(--admin-border)" }}>
            <p className="m-0 text-xs" style={{ color: "var(--admin-text-muted)" }}>Resultados</p>
            <p className="m-0 mt-1 text-base font-semibold">
              {activeSubscriptions.length} activo(s) y {inactiveSubscriptions.length} inactivo(s)
            </p>
          </div>
        </div>
        <h3 className="mt-5 text-sm font-semibold" style={{ color: "var(--admin-text)" }}>
          Clientes activos ({activeSubscriptions.length})
        </h3>
        <div className="mt-4 overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Servicio</th>
                <th>Plan</th>
                <th>Estado</th>
                <th>Cobro mensual</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {activeSubscriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-sm" style={{ color: "var(--admin-text-muted)" }}>
                    No hay clientes activos para el filtro seleccionado.
                  </td>
                </tr>
              ) : (
                activeSubscriptions.map((subscription) => (
                  <tr key={subscription.id}>
                    <td><span className="font-mono text-xs" style={{ color: "var(--admin-text-muted)" }}>{subscription.id.slice(0, 8)}…</span></td>
                    <td style={{ fontWeight: 500 }}>{subscription.companies?.legal_name ?? "-"}</td>
                    <td>{subscription.services?.name ?? subscription.services?.slug ?? "-"}</td>
                    <td>{subscription.plans?.name ?? "-"}</td>
                    <td><StatusBadge status={subscription.status} /></td>
                    <td>
                      {subscription.has_pending_payment ? (
                        <span className="badge badge-warning">pendiente</span>
                      ) : (
                        <span className="badge badge-success">al día</span>
                      )}
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        <button
                          disabled={working}
                          className="admin-btn admin-btn-warning admin-btn-sm"
                          onClick={() => onUpdateSubscriptionStatus(subscription.id, "suspended")}
                          type="button"
                        >
                          Dar de baja
                        </button>
                        <button disabled={working} className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => onRegenerateToken(subscription.id)} type="button">Renovar token</button>
                        <button disabled={working} className="admin-btn admin-btn-success admin-btn-sm" onClick={() => onOpenInvoiceModal(subscription)} type="button">Enviar boleta</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <details className="mt-4 rounded-lg border p-3" style={{ borderColor: "var(--admin-border)" }}>
          <summary className="cursor-pointer text-sm font-semibold" style={{ color: "var(--admin-text)" }}>
            Clientes inactivos (suspendidos/cancelados): {inactiveSubscriptions.length}
          </summary>
          <div className="mt-4 overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Cliente</th>
                  <th>Servicio</th>
                  <th>Plan</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {inactiveSubscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-sm" style={{ color: "var(--admin-text-muted)" }}>
                      No hay clientes inactivos para el filtro seleccionado.
                    </td>
                  </tr>
                ) : (
                  inactiveSubscriptions.map((subscription) => (
                    <tr key={subscription.id}>
                      <td><span className="font-mono text-xs" style={{ color: "var(--admin-text-muted)" }}>{subscription.id.slice(0, 8)}…</span></td>
                      <td style={{ fontWeight: 500 }}>{subscription.companies?.legal_name ?? "-"}</td>
                      <td>{subscription.services?.name ?? subscription.services?.slug ?? "-"}</td>
                      <td>{subscription.plans?.name ?? "-"}</td>
                      <td><StatusBadge status={subscription.status} /></td>
                      <td>
                        <button
                          disabled={working}
                          className="admin-btn admin-btn-success admin-btn-sm"
                          onClick={() => onUpdateSubscriptionStatus(subscription.id, "active")}
                          type="button"
                        >
                          Reactivar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </details>
      </div>
      ) : null}

      {invoiceModalSubscription ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }} role="dialog" aria-modal="true">
          <div
            className="w-full max-w-2xl rounded-2xl border p-5"
            style={{ background: "var(--admin-surface)", borderColor: "var(--admin-border)", boxShadow: "0 8px 48px rgba(0,0,0,0.4)" }}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="m-0 text-sm font-semibold" style={{ color: "var(--admin-text)" }}>
                  Enviar boleta al cliente
                </p>
                <p className="m-0 mt-1 text-xs" style={{ color: "var(--admin-text-muted)" }}>
                  Se enviará al correo registrado: <strong>{invoiceModalSubscription.companies?.email ?? "sin email"}</strong>
                </p>
              </div>
              <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={onCloseInvoiceModal} type="button" disabled={working}>
                Cerrar
              </button>
            </div>

            <div className="mt-4 grid gap-4">
              <div className="admin-field">
                <label className="admin-label">Boleta PDF</label>
                <input
                  className="admin-input"
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setInvoiceFile(e.target.files?.[0] ?? null)}
                />
              </div>
              <div className="admin-field">
                <label className="admin-label">Mensaje opcional</label>
                <textarea
                  className="admin-input"
                  rows={4}
                  placeholder="Ej: Adjuntamos la boleta correspondiente al servicio del mes."
                  value={invoiceNote}
                  onChange={(e) => setInvoiceNote(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
              <button className="admin-btn admin-btn-secondary" type="button" onClick={onCloseInvoiceModal} disabled={working}>
                Cancelar
              </button>
              <button className="admin-btn admin-btn-primary" type="button" onClick={onSendInvoice} disabled={working || !invoiceFile}>
                {working ? "Enviando..." : "Enviar boleta"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
