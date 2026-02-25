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

function normalizeRut(raw: string) {
  return raw.replace(/[^0-9kK]/g, "").toUpperCase();
}

function formatRut(raw: string) {
  const normalized = normalizeRut(raw);
  if (normalized.length < 2) return normalized;
  const body = normalized.slice(0, -1);
  const dv = normalized.slice(-1);
  return `${Number(body).toLocaleString("es-CL").replace(/\./g, "")}-${dv}`;
}

function isValidRut(raw: string) {
  const normalized = normalizeRut(raw);
  if (!/^\d{7,8}[0-9K]$/.test(normalized)) return false;
  const body = normalized.slice(0, -1);
  const expectedDv = normalized.slice(-1);
  let sum = 0;
  let multiplier = 2;

  for (let i = body.length - 1; i >= 0; i -= 1) {
    sum += Number(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = 11 - (sum % 11);
  const computedDv = remainder === 11 ? "0" : remainder === 10 ? "K" : String(remainder);
  return expectedDv === computedDv;
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
  const [previewFormSnapshot, setPreviewFormSnapshot] = useState<string | null>(null);

  const [form, setForm] = useState({
    customerType: "company" as "company" | "person",
    companyName: "",
    rut: "",
    address: "",
    email: "",
    phone: "",
    legalRepresentativeName: "",
    legalRepresentativeRut: "",
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

  useEffect(() => {
    if (previewFormSnapshot && previewFormSnapshot !== currentFormSnapshot) {
      setPreview(null);
      setPreviewFormSnapshot(null);
    }
  }, [currentFormSnapshot, previewFormSnapshot]);

  async function onPreviewContract() {
    setWorking(true);
    setError(null);
    setMessage(null);

    const response = await fetch("/api/admin/billing/onboarding/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
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
    setPreviewFormSnapshot(currentFormSnapshot);
    setMessage("Previsualización lista. Ya puedes crear onboarding.");
    setWorking(false);
  }
  async function onCreateOnboarding(event: FormEvent) {
    event.preventDefault();
    if (!isValidRut(form.rut)) {
      setError("RUT inválido. Usa formato 12345678-9");
      return;
    }
    if (form.customerType === "company" && form.legalRepresentativeRut.trim() && !isValidRut(form.legalRepresentativeRut)) {
      setError("RUT de representante legal inválido.");
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
      body: JSON.stringify(form),
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
    <section className="grid gap-4">
      {error ? <p className="text-sm font-medium text-red-400">{error}</p> : null}
      {message ? <p className="text-sm font-medium text-emerald-400">{message}</p> : null}
      {onboardingUrl ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
          <p className="m-0 text-xs font-semibold text-emerald-300">Link onboarding generado</p>
          <p className="mt-1 break-all text-xs text-emerald-100">{onboardingUrl}</p>
        </div>
      ) : null}

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="m-0 text-base font-bold text-slate-100">Crear onboarding</h2>
        <p className="mt-1 text-xs text-slate-400">Este paso crea empresa + suscripción + token + primer pago pendiente.</p>

        <form className="mt-3 grid gap-2" onSubmit={onCreateOnboarding}>
          <div className="grid gap-2 md:grid-cols-2">
            <select className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100" value={form.customerType} onChange={(e) => setForm((v) => ({ ...v, customerType: e.target.value as "company" | "person", contractTemplateId: "" }))} required>
              <option value="company">Empresa</option>
              <option value="person">Persona natural</option>
            </select>
            <input className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100" placeholder={form.customerType === "company" ? "Razón social" : "Nombre completo"} value={form.companyName} onChange={(e) => setForm((v) => ({ ...v, companyName: e.target.value }))} required />
          </div>
          <input className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100" placeholder="RUT (ej: 16370698-9)" value={form.rut} onBlur={(e) => setForm((v) => ({ ...v, rut: formatRut(e.target.value) }))} onChange={(e) => setForm((v) => ({ ...v, rut: e.target.value }))} required />
          {form.customerType === "company" ? (
            <div className="grid gap-2 md:grid-cols-2">
              <input className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100" placeholder="Representante legal (opcional)" value={form.legalRepresentativeName} onChange={(e) => setForm((v) => ({ ...v, legalRepresentativeName: e.target.value }))} />
              <input className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100" placeholder="RUT representante (opcional)" value={form.legalRepresentativeRut} onBlur={(e) => setForm((v) => ({ ...v, legalRepresentativeRut: formatRut(e.target.value) }))} onChange={(e) => setForm((v) => ({ ...v, legalRepresentativeRut: e.target.value }))} />
            </div>
          ) : null}
          <input className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100" placeholder="Dirección" value={form.address} onChange={(e) => setForm((v) => ({ ...v, address: e.target.value }))} required />
          <input className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm((v) => ({ ...v, email: e.target.value }))} required />
          <input className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100" placeholder="Teléfono" value={form.phone} onChange={(e) => setForm((v) => ({ ...v, phone: e.target.value }))} required />

          <div className="grid gap-2 md:grid-cols-4">
            <select className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100" value={form.serviceSlug} onChange={(e) => setForm((v) => ({ ...v, serviceSlug: e.target.value, planId: "", contractTemplateId: "" }))} required>
              <option value="">Servicio Kumera</option>
              {platformServices.map((service) => (
                <option key={service.id} value={service.slug}>{service.name} ({service.slug})</option>
              ))}
            </select>
            <select className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100" value={form.planId} onChange={(e) => setForm((v) => ({ ...v, planId: e.target.value }))} required>
              <option value="">Plan</option>
              {plansForService.map((plan) => (
                <option key={plan.id} value={plan.id}>{plan.name} · ${Math.floor(plan.price_cents / 100)}</option>
              ))}
            </select>
            <select className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100" value={form.taxDocumentType} onChange={(e) => setForm((v) => ({ ...v, taxDocumentType: e.target.value }))} required>
              <option value="factura">Factura</option>
              <option value="boleta">Boleta</option>
            </select>
            <select className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100" value={form.contractTemplateId} onChange={(e) => setForm((v) => ({ ...v, contractTemplateId: e.target.value }))} required>
              <option value="">Plantilla contrato</option>
              {templatesForService.map((template) => (
                <option key={template.id} value={template.id}>{template.name} ({template.version})</option>
              ))}
            </select>
          </div>

          <button disabled={working || loading} className="w-fit rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-700 disabled:opacity-60" type="submit">
            {working ? "Procesando..." : "Crear onboarding"}
          </button>
          <button disabled={working || loading} className="w-fit rounded-lg border border-blue-500/40 bg-blue-500/10 px-3 py-2 text-sm font-semibold text-blue-200 hover:bg-blue-500/20 disabled:opacity-60" onClick={onPreviewContract} type="button">
            {working ? "Procesando..." : "Previsualizar contrato"}
          </button>
        </form>
        {preview ? (
          <div className="mt-4 rounded-xl border border-blue-500/30 bg-blue-500/5 p-4">
            <p className="m-0 text-xs font-semibold text-blue-200">
              Preview: {preview.serviceName} · {preview.planName} · {preview.templateName}
            </p>
            <p className="mt-1 text-xs text-blue-100">Hash: <span className="font-mono">{preview.contentHash.slice(0, 16)}</span></p>
            <article className="prose prose-invert mt-3 max-w-none rounded-lg border border-slate-700 bg-slate-950/60 p-3 text-sm" dangerouslySetInnerHTML={{ __html: preview.htmlRendered }} />
          </div>
        ) : (
          <p className="mt-3 text-xs text-slate-500">Previsualiza el contrato con los datos actuales antes de generar el token onboarding.</p>
        )}
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="m-0 text-base font-bold text-slate-100">Plantillas de contrato (precargadas)</h2>
        <p className="mt-1 text-xs text-slate-400">
          Estas plantillas se cargan desde la base de datos y se seleccionan al crear onboarding.
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="border-b border-slate-700 px-2 py-2 text-left text-xs text-slate-400">Servicio</th>
                <th className="border-b border-slate-700 px-2 py-2 text-left text-xs text-slate-400">Nombre</th>
                <th className="border-b border-slate-700 px-2 py-2 text-left text-xs text-slate-400">Versión</th>
                <th className="border-b border-slate-700 px-2 py-2 text-left text-xs text-slate-400">Tipo cliente</th>
                <th className="border-b border-slate-700 px-2 py-2 text-left text-xs text-slate-400">Estado</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((template) => (
                <tr key={template.id}>
                  <td className="border-b border-slate-800 px-2 py-2 text-slate-200">{services.find((s) => s.id === template.service_id)?.name ?? template.service_id}</td>
                  <td className="border-b border-slate-800 px-2 py-2 text-slate-200">{template.name}</td>
                  <td className="border-b border-slate-800 px-2 py-2 text-slate-200">{template.version}</td>
                  <td className="border-b border-slate-800 px-2 py-2 text-slate-200">{template.target_customer_type}</td>
                  <td className="border-b border-slate-800 px-2 py-2 text-slate-200">{template.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="m-0 text-base font-bold text-slate-100">Pagos</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="border-b border-slate-700 px-2 py-2 text-left text-xs text-slate-400">Cliente</th>
                <th className="border-b border-slate-700 px-2 py-2 text-left text-xs text-slate-400">Servicio</th>
                <th className="border-b border-slate-700 px-2 py-2 text-left text-xs text-slate-400">Plan</th>
                <th className="border-b border-slate-700 px-2 py-2 text-left text-xs text-slate-400">Estado</th>
                <th className="border-b border-slate-700 px-2 py-2 text-left text-xs text-slate-400">Monto</th>
                <th className="border-b border-slate-700 px-2 py-2 text-left text-xs text-slate-400">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="border-b border-slate-800 px-2 py-2 text-slate-200">{payment.subscriptions?.companies?.legal_name ?? "-"}</td>
                  <td className="border-b border-slate-800 px-2 py-2 text-slate-200">{payment.subscriptions?.services?.name ?? "-"}</td>
                  <td className="border-b border-slate-800 px-2 py-2 text-slate-200">{payment.subscriptions?.plans?.name ?? "-"}</td>
                  <td className="border-b border-slate-800 px-2 py-2 text-slate-200">{payment.status}</td>
                  <td className="border-b border-slate-800 px-2 py-2 text-slate-200">${Math.floor((payment.amount_cents ?? 0) / 100)}</td>
                  <td className="border-b border-slate-800 px-2 py-2">
                    <div className="flex gap-2">
                      <button disabled={working || payment.status === "validated"} className="rounded border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-300 disabled:opacity-50" onClick={() => onValidatePayment(payment.id)} type="button">Validar</button>
                      <button disabled={working || payment.status === "rejected"} className="rounded border border-red-500/40 bg-red-500/10 px-2 py-1 text-xs font-semibold text-red-300 disabled:opacity-50" onClick={() => onRejectPayment(payment.id)} type="button">Rechazar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="m-0 text-base font-bold text-slate-100">Clientes onboardeados</h2>
          <a className="text-xs font-semibold text-blue-300 hover:underline" href={legacyAdminUrl} rel="noreferrer" target="_blank">Legacy admin</a>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Este listado muestra clientes/suscripciones creadas en onboarding, no el catálogo de servicios de Kumera.
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="border-b border-slate-700 px-2 py-2 text-left text-xs text-slate-400">ID</th>
                <th className="border-b border-slate-700 px-2 py-2 text-left text-xs text-slate-400">Cliente</th>
                <th className="border-b border-slate-700 px-2 py-2 text-left text-xs text-slate-400">Servicio</th>
                <th className="border-b border-slate-700 px-2 py-2 text-left text-xs text-slate-400">Plan</th>
                <th className="border-b border-slate-700 px-2 py-2 text-left text-xs text-slate-400">Estado</th>
                <th className="border-b border-slate-700 px-2 py-2 text-left text-xs text-slate-400">Acción</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((subscription) => (
                <tr key={subscription.id}>
                  <td className="border-b border-slate-800 px-2 py-2 text-slate-300">{subscription.id}</td>
                  <td className="border-b border-slate-800 px-2 py-2 text-slate-200">{subscription.companies?.legal_name ?? "-"}</td>
                  <td className="border-b border-slate-800 px-2 py-2 text-slate-200">{subscription.services?.name ?? subscription.services?.slug ?? "-"}</td>
                  <td className="border-b border-slate-800 px-2 py-2 text-slate-200">{subscription.plans?.name ?? "-"}</td>
                  <td className="border-b border-slate-800 px-2 py-2 text-slate-200">{subscription.status}</td>
                  <td className="border-b border-slate-800 px-2 py-2">
                    <button disabled={working} className="rounded border border-blue-500/40 bg-blue-500/10 px-2 py-1 text-xs font-semibold text-blue-300 disabled:opacity-50" onClick={() => onRegenerateToken(subscription.id)} type="button">Regenerar token</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
