"use client";

import { FormEvent, useState } from "react";

type Category = { id: string; slug: string; name: string };
type Region = { id: string; code: string; name: string };

type ExecutiveRow = {
  id: string;
  name: string;
  slug: string;
  phone: string;
  company: string;
  plan: "bronce" | "plata" | "oro" | null;
  status: "draft" | "pending" | "active" | "inactive";
  verified: boolean;
  created_at: string;
  executive_categories?: Array<{ categories: { id: string; name: string; slug: string } | null }>;
  executive_regions?: Array<{ regions: { id: string; code: string; name: string } | null }>;
};

type SubmissionRow = {
  id: string;
  token_id: string | null;
  full_name: string;
  email: string;
  phone: string;
  company: string;
  status: "pending" | "reviewed" | "approved" | "rejected";
  created_at: string;
};

type Props = {
  onboardingAdminBaseUrl: string;
  initialCategories: Category[];
  initialRegions: Region[];
  initialSubmissions: SubmissionRow[];
  initialExecutives: ExecutiveRow[];
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "badge-success", approved: "badge-success", pending: "badge-warning",
    reviewed: "badge-accent", draft: "badge-neutral", inactive: "badge-neutral",
    rejected: "badge-error",
  };
  return <span className={`badge ${map[status] ?? "badge-neutral"}`}>{status}</span>;
}

export default function TuejecutivaAdminClient({
  onboardingAdminBaseUrl,
  initialCategories,
  initialRegions,
  initialSubmissions,
  initialExecutives,
}: Props) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [executives, setExecutives] = useState<ExecutiveRow[]>(initialExecutives);
  const [tokenResult, setTokenResult] = useState<null | {
    token: string;
    email: string | null;
    expires_at: string;
    link: string;
    reused: boolean;
  }>(null);
  const [submissions] = useState<SubmissionRow[]>(initialSubmissions);

  const [tokenForm, setTokenForm] = useState({ email: "", expires_in_days: 7 });
  const [executiveForm, setExecutiveForm] = useState({
    name: "",
    slug: "",
    phone: "",
    company: "",
    specialty: "",
    description: "",
    whatsapp_message: "",
    plan: "bronce" as "bronce" | "plata" | "oro",
    experience_years: "",
    company_website_url: "",
    coverage_all: false,
    category_ids: [] as string[],
    region_ids: [] as string[],
  });

  async function onCreateToken(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const response = await fetch("/api/admin/tuejecutiva/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tokenForm),
    });
    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error ?? "No se pudo crear token");
      return;
    }

    setTokenResult(payload.token);
    setMessage(payload.token.reused ? "Token activo reutilizado." : "Token creado correctamente.");
  }

  async function onCreateExecutive(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const finalSlug = executiveForm.slug.trim().length > 0 ? slugify(executiveForm.slug) : slugify(executiveForm.name);

    const response = await fetch("/api/admin/tuejecutiva/executives", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...executiveForm,
        slug: finalSlug,
        experience_years:
          executiveForm.experience_years.trim().length > 0
            ? Number(executiveForm.experience_years)
            : null,
        specialty: executiveForm.specialty.trim() || null,
        description: executiveForm.description.trim() || null,
        whatsapp_message: executiveForm.whatsapp_message.trim() || null,
        company_website_url: executiveForm.company_website_url.trim() || null,
      }),
    });
    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error ?? "No se pudo crear ejecutiva");
      return;
    }

    setExecutives((prev) => [payload.executive, ...prev]);
    setMessage("Ejecutiva creada correctamente.");
    setExecutiveForm({
      name: "",
      slug: "",
      phone: "",
      company: "",
      specialty: "",
      description: "",
      whatsapp_message: "",
      plan: "bronce",
      experience_years: "",
      company_website_url: "",
      coverage_all: false,
      category_ids: [],
      region_ids: [],
    });
  }

  function toggleCategory(categoryId: string) {
    setExecutiveForm((prev) => ({
      ...prev,
      category_ids: prev.category_ids.includes(categoryId)
        ? prev.category_ids.filter((id) => id !== categoryId)
        : [...prev.category_ids, categoryId],
    }));
  }

  function toggleRegion(regionId: string) {
    setExecutiveForm((prev) => ({
      ...prev,
      region_ids: prev.region_ids.includes(regionId)
        ? prev.region_ids.filter((id) => id !== regionId)
        : [...prev.region_ids, regionId],
    }));
  }

  return (
    <div className="grid gap-5">
      {message ? <div className="admin-alert admin-alert-success">{message}</div> : null}
      {error ? <div className="admin-alert admin-alert-error">{error}</div> : null}

      {/* ─── PASO 1: Generate token ─── */}
      <form className="admin-card" onSubmit={onCreateToken}>
        <div className="mb-4 flex items-center gap-3">
          <span className="badge badge-accent">PASO 1</span>
          <h2 className="section-title">Generar token onboarding</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="admin-field">
            <label className="admin-label">Email (opcional)</label>
            <input className="admin-input" type="email" placeholder="ejecutiva@empresa.cl" value={tokenForm.email} onChange={(e) => setTokenForm((prev) => ({ ...prev, email: e.target.value }))} />
          </div>
          <div className="admin-field">
            <label className="admin-label">Días de expiración</label>
            <input className="admin-input" type="number" min={1} max={30} value={tokenForm.expires_in_days} onChange={(e) => setTokenForm((prev) => ({ ...prev, expires_in_days: Number(e.target.value) }))} required />
          </div>
        </div>
        <button className="admin-btn admin-btn-primary mt-4" type="submit">Generar token</button>

        {tokenResult ? (
          <div className="admin-alert admin-alert-success mt-4">
            <div>
              <p className="m-0 text-xs font-semibold">{tokenResult.reused ? "Token activo reutilizado" : "Token creado"}</p>
              <p className="m-0 mt-1 break-all text-xs">{tokenResult.link}</p>
              <p className="m-0 mt-0.5 text-xs">Email: {tokenResult.email ?? "—"}</p>
              <p className="m-0 mt-0.5 text-xs">Expira: {new Date(tokenResult.expires_at).toLocaleString("es-CL")}</p>
            </div>
          </div>
        ) : null}
      </form>

      {/* ─── PASO 2: Create executive ─── */}
      <form className="admin-card" onSubmit={onCreateExecutive}>
        <div className="mb-4 flex items-center gap-3">
          <span className="badge badge-accent">PASO 2</span>
          <h2 className="section-title">Crear ejecutiva manual</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="admin-field">
            <label className="admin-label">Nombre</label>
            <input className="admin-input" placeholder="Nombre" value={executiveForm.name} onChange={(e) => setExecutiveForm((prev) => ({ ...prev, name: e.target.value }))} required />
          </div>
          <div className="admin-field">
            <label className="admin-label">Slug (opcional)</label>
            <input className="admin-input" placeholder="generado-automaticamente" value={executiveForm.slug} onChange={(e) => setExecutiveForm((prev) => ({ ...prev, slug: e.target.value }))} />
          </div>
          <div className="admin-field">
            <label className="admin-label">Teléfono</label>
            <input className="admin-input" placeholder="Teléfono" value={executiveForm.phone} onChange={(e) => setExecutiveForm((prev) => ({ ...prev, phone: e.target.value }))} required />
          </div>
          <div className="admin-field">
            <label className="admin-label">Empresa</label>
            <input className="admin-input" placeholder="Empresa" value={executiveForm.company} onChange={(e) => setExecutiveForm((prev) => ({ ...prev, company: e.target.value }))} required />
          </div>
          <div className="admin-field">
            <label className="admin-label">Especialidad</label>
            <input className="admin-input" placeholder="Especialidad" value={executiveForm.specialty} onChange={(e) => setExecutiveForm((prev) => ({ ...prev, specialty: e.target.value }))} />
          </div>
          <div className="admin-field">
            <label className="admin-label">Plan</label>
            <select className="admin-input" value={executiveForm.plan} onChange={(e) => setExecutiveForm((prev) => ({ ...prev, plan: e.target.value as "bronce" | "plata" | "oro" }))}>
              <option value="bronce">Bronce</option>
              <option value="plata">Plata</option>
              <option value="oro">Oro</option>
            </select>
          </div>
          <div className="admin-field">
            <label className="admin-label">Años experiencia (opcional)</label>
            <input className="admin-input" placeholder="Años" value={executiveForm.experience_years} onChange={(e) => setExecutiveForm((prev) => ({ ...prev, experience_years: e.target.value }))} />
          </div>
          <div className="admin-field">
            <label className="admin-label">Sitio web empresa</label>
            <input className="admin-input" placeholder="https://..." value={executiveForm.company_website_url} onChange={(e) => setExecutiveForm((prev) => ({ ...prev, company_website_url: e.target.value }))} />
          </div>
        </div>

        <div className="mt-4 admin-field">
          <label className="admin-label">Descripción</label>
          <textarea className="admin-input" placeholder="Descripción" rows={3} value={executiveForm.description} onChange={(e) => setExecutiveForm((prev) => ({ ...prev, description: e.target.value }))} />
        </div>
        <div className="mt-4 admin-field">
          <label className="admin-label">Mensaje WhatsApp</label>
          <textarea className="admin-input" placeholder="Mensaje WhatsApp" rows={2} value={executiveForm.whatsapp_message} onChange={(e) => setExecutiveForm((prev) => ({ ...prev, whatsapp_message: e.target.value }))} />
        </div>

        {/* Categories */}
        <div className="mt-4 rounded-lg border p-4" style={{ background: "var(--admin-surface-raised)", borderColor: "var(--admin-border)" }}>
          <p className="m-0 text-xs font-semibold" style={{ color: "var(--admin-text-secondary)" }}>Categorías</p>
          <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3">
            {initialCategories.map((category) => (
              <label key={category.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-white/5" style={{ color: "var(--admin-text)" }}>
                <input type="checkbox" checked={executiveForm.category_ids.includes(category.id)} onChange={() => toggleCategory(category.id)} className="accent-[var(--admin-accent)]" />
                {category.name}
              </label>
            ))}
          </div>
        </div>

        {/* Coverage toggle */}
        <label className="mt-4 flex cursor-pointer items-center gap-2 text-xs" style={{ color: "var(--admin-text)" }}>
          <input type="checkbox" checked={executiveForm.coverage_all} onChange={(e) => setExecutiveForm((prev) => ({ ...prev, coverage_all: e.target.checked }))} className="accent-[var(--admin-accent)]" />
          Cobertura nacional (si activas esto, ignora regiones)
        </label>

        {/* Regions */}
        <div className="mt-4 rounded-lg border p-4" style={{ background: "var(--admin-surface-raised)", borderColor: "var(--admin-border)" }}>
          <p className="m-0 text-xs font-semibold" style={{ color: "var(--admin-text-secondary)" }}>Regiones</p>
          <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3">
            {initialRegions.map((region) => (
              <label key={region.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-white/5" style={{ color: executiveForm.coverage_all ? "var(--admin-text-muted)" : "var(--admin-text)" }}>
                <input type="checkbox" checked={executiveForm.region_ids.includes(region.id)} onChange={() => toggleRegion(region.id)} disabled={executiveForm.coverage_all} className="accent-[var(--admin-accent)]" />
                {region.name} ({region.code})
              </label>
            ))}
          </div>
        </div>

        <button className="admin-btn admin-btn-primary mt-5" type="submit">Crear ejecutiva</button>
      </form>

      {/* ─── Submissions table ─── */}
      <div className="admin-card">
        <div className="flex items-center justify-between gap-3">
          <h2 className="section-title">Postulaciones pendientes</h2>
          <a href={`${onboardingAdminBaseUrl}`} target="_blank" rel="noreferrer" className="admin-btn admin-btn-ghost admin-btn-sm no-underline">
            Admin onboarding ↗
          </a>
        </div>
        <p className="section-desc">Ejecutivas que respondieron onboarding y aún no han sido activadas.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Empresa</th>
                <th>Contacto</th>
                <th>Estado</th>
                <th>Creado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {submissions.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ color: "var(--admin-text-muted)", textAlign: "center", padding: "24px 14px" }}>
                    No hay postulaciones pendientes por activar.
                  </td>
                </tr>
              ) : (
                submissions.map((row) => (
                  <tr key={row.id}>
                    <td style={{ fontWeight: 500 }}>{row.full_name}</td>
                    <td>{row.company || "-"}</td>
                    <td>
                      <p className="m-0 text-xs">{row.email}</p>
                      <p className="m-0 text-[11px]" style={{ color: "var(--admin-text-muted)" }}>{row.phone || "-"}</p>
                    </td>
                    <td><StatusBadge status={row.status} /></td>
                    <td style={{ color: "var(--admin-text-muted)" }}>{new Date(row.created_at).toLocaleString("es-CL")}</td>
                    <td>
                      <a
                        href={`${onboardingAdminBaseUrl}/submissions/${row.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="admin-btn admin-btn-secondary admin-btn-sm no-underline"
                      >
                        Revisar
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Executives table ─── */}
      <div className="admin-card">
        <h2 className="section-title">Ejecutivas actuales</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Empresa</th>
                <th>Plan</th>
                <th>Estado</th>
                <th>Categorías</th>
                <th>Regiones</th>
              </tr>
            </thead>
            <tbody>
              {executives.map((row) => {
                const categories = (row.executive_categories ?? [])
                  .map((item) => item.categories?.name)
                  .filter(Boolean)
                  .join(", ");
                const regions = (row.executive_regions ?? [])
                  .map((item) => item.regions?.code ?? item.regions?.name)
                  .filter(Boolean)
                  .join(", ");

                return (
                  <tr key={row.id}>
                    <td>
                      <p className="m-0 font-medium">{row.name}</p>
                      <p className="m-0 text-[11px] font-mono" style={{ color: "var(--admin-text-muted)" }}>/{row.slug}</p>
                    </td>
                    <td>{row.company}</td>
                    <td>{row.plan ? <span className="badge badge-accent">{row.plan}</span> : "-"}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={row.status} />
                        {row.verified ? <span className="badge badge-success">✓</span> : <span className="badge badge-neutral">sin verificar</span>}
                      </div>
                    </td>
                    <td style={{ color: "var(--admin-text-secondary)", maxWidth: 160 }}>{categories || "-"}</td>
                    <td style={{ color: "var(--admin-text-secondary)", maxWidth: 160 }}>{regions || "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
