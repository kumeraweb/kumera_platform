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
  amount_cents: number;
  due_date: string;
  validated_at: string | null;
  rejection_reason: string | null;
  subscription_id: string;
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
  companies?: { legal_name?: string | null };
  services?: { slug?: string | null; name?: string | null };
  plans?: { id?: string | null; name?: string | null; price_cents?: number | null };
};

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
    pending: "badge-warning",
    pending_onboarding: "badge-warning",
    draft: "badge-neutral",
    rejected: "badge-error",
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
  const [preview, setPreview] = useState<{
    htmlRendered: string;
    contentHash: string;
    serviceName: string;
    planName: string;
    templateName: string;
  } | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFormSnapshot, setPreviewFormSnapshot] = useState<string | null>(null);

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
    planId: "",
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
    if (plansForService.length > 0 && !plansForService.some((plan) => plan.id === form.planId)) {
      setForm((prev) => ({ ...prev, planId: plansForService[0].id }));
    }
  }, [form.planId, plansForService]);
  useEffect(() => {
    if (templatesForService.length > 0 && !templatesForService.some((template) => template.id === form.contractTemplateId)) {
      setForm((prev) => ({ ...prev, contractTemplateId: templatesForService[0].id }));
    }
  }, [form.contractTemplateId, templatesForService]);

  function validateOnboardingForm() {
    if (!form.serviceSlug) return "Debes seleccionar un servicio.";
    if (!form.planId) return "Debes seleccionar un plan.";
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

    const response = await fetch("/api/admin/billing/onboarding/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
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

    setMessage("Token regenerado.");
    setOnboardingUrl(payload.onboardingUrl ?? null);
    setWorking(false);
  }

  return (
    <div className="grid gap-5">
      {/* Page header */}
      <div>
        <h1 className="section-title" style={{ fontSize: 20 }}>Billing</h1>
        <p className="section-desc">Onboarding de clientes, pagos y suscripciones.</p>
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
              <label className="admin-label">Plan</label>
              <select className="admin-input" value={form.planId} onChange={(e) => setForm((v) => ({ ...v, planId: e.target.value }))} required>
                <option value="">Seleccionar…</option>
                {plansForService.map((plan) => (
                  <option key={plan.id} value={plan.id}>{plan.name} · ${Math.floor(plan.price_cents / 100)}</option>
                ))}
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

      {/* ─── Templates table ─── */}
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

      {/* ─── Payments table ─── */}
      <div className="admin-card">
        <h2 className="section-title">Pagos</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Servicio</th>
                <th>Plan</th>
                <th>Estado</th>
                <th>Monto</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td style={{ fontWeight: 500 }}>{payment.subscriptions?.companies?.legal_name ?? "-"}</td>
                  <td>{payment.subscriptions?.services?.name ?? "-"}</td>
                  <td>{payment.subscriptions?.plans?.name ?? "-"}</td>
                  <td><StatusBadge status={payment.status} /></td>
                  <td className="font-mono">${Math.floor((payment.amount_cents ?? 0) / 100)}</td>
                  <td>
                    <div className="flex gap-2">
                      <button disabled={working || payment.status === "validated"} className="admin-btn admin-btn-success admin-btn-sm" onClick={() => onValidatePayment(payment.id)} type="button">Validar</button>
                      <button disabled={working || payment.status === "rejected"} className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => onRejectPayment(payment.id)} type="button">Rechazar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Subscriptions table ─── */}
      <div className="admin-card">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="section-title">Clientes onboardeados</h2>
            <p className="section-desc">Clientes y suscripciones creadas en onboarding.</p>
          </div>
          <a className="admin-btn admin-btn-ghost admin-btn-sm" href={legacyAdminUrl} rel="noreferrer" target="_blank">Legacy admin ↗</a>
        </div>
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
              {subscriptions.map((subscription) => (
                <tr key={subscription.id}>
                  <td><span className="font-mono text-xs" style={{ color: "var(--admin-text-muted)" }}>{subscription.id.slice(0, 8)}…</span></td>
                  <td style={{ fontWeight: 500 }}>{subscription.companies?.legal_name ?? "-"}</td>
                  <td>{subscription.services?.name ?? subscription.services?.slug ?? "-"}</td>
                  <td>{subscription.plans?.name ?? "-"}</td>
                  <td><StatusBadge status={subscription.status} /></td>
                  <td>
                    <button disabled={working} className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => onRegenerateToken(subscription.id)} type="button">Regenerar token</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
