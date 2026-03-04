"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

type Category = { id: string; slug: string; name: string };
type Region = { id: string; code: string; name: string };

type SubmissionDetail = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  company: string;
  experience_years: number | null;
  specialty: string | null;
  description: string | null;
  whatsapp_message: string | null;
  photo_url: string | null;
  company_logo_url: string | null;
  faq: unknown;
  coverage_all: boolean;
  status: "pending" | "reviewed" | "approved" | "rejected";
  custom_category: string | null;
  category_ids: string[];
  region_ids: string[];
};

type Props = {
  submission: SubmissionDetail;
  initialCategories: Category[];
  initialRegions: Region[];
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
    approved: "badge-success",
    pending: "badge-warning",
    reviewed: "badge-accent",
    rejected: "badge-error",
  };
  return <span className={`badge ${map[status] ?? "badge-neutral"}`}>{status}</span>;
}

export default function TuejecutivaSubmissionReviewClient({
  submission,
  initialCategories,
  initialRegions,
}: Props) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [regions] = useState<Region[]>(initialRegions);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  const [newCategory, setNewCategory] = useState({
    name: submission.custom_category ?? "",
    slug: "",
    description: "",
  });

  const [form, setForm] = useState({
    name: submission.full_name,
    slug: slugify(submission.full_name),
    phone: submission.phone,
    company: submission.company,
    specialty: submission.specialty ?? "",
    description: submission.description ?? "",
    whatsapp_message: submission.whatsapp_message ?? "",
    plan: "bronce" as "bronce" | "plata" | "oro",
    experience_years:
      submission.experience_years !== null ? String(submission.experience_years) : "",
    company_website_url: "",
    photo_url: submission.photo_url ?? "",
    company_logo_url: submission.company_logo_url ?? "",
    faq_json: JSON.stringify(Array.isArray(submission.faq) ? submission.faq : [], null, 2),
    coverage_all: submission.coverage_all,
    category_ids: submission.category_ids,
    region_ids: submission.region_ids,
    mark_submission_approved: submission.status === "pending" || submission.status === "reviewed",
  });

  const canSubmit = useMemo(
    () =>
      form.name.trim().length > 0 &&
      form.phone.trim().length > 0 &&
      form.company.trim().length > 0 &&
      form.category_ids.length > 0,
    [form]
  );

  function toggleCategory(categoryId: string) {
    setForm((prev) => ({
      ...prev,
      category_ids: prev.category_ids.includes(categoryId)
        ? prev.category_ids.filter((id) => id !== categoryId)
        : [...prev.category_ids, categoryId],
    }));
  }

  function toggleRegion(regionId: string) {
    setForm((prev) => ({
      ...prev,
      region_ids: prev.region_ids.includes(regionId)
        ? prev.region_ids.filter((id) => id !== regionId)
        : [...prev.region_ids, regionId],
    }));
  }

  async function onCreateCategory(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (newCategory.name.trim().length === 0) {
      setError("Debes indicar un nombre de categoría.");
      return;
    }

    setWorking(true);
    const response = await fetch("/api/admin/tuejecutiva/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newCategory.name,
        slug: newCategory.slug.trim() || undefined,
        description: newCategory.description.trim() || null,
      }),
    });
    const payload = await response.json();
    setWorking(false);

    if (!response.ok) {
      setError(payload.error ?? "No se pudo crear categoría.");
      return;
    }

    const created = payload.category as Category;
    setCategories((prev) => [created, ...prev]);
    setForm((prev) => ({ ...prev, category_ids: [...prev.category_ids, created.id] }));
    setNewCategory({ name: "", slug: "", description: "" });
    setMessage(`Categoría creada: ${created.name}`);
  }

  async function onCreateExecutive(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!canSubmit) {
      setError("Completa nombre, teléfono, empresa y al menos una categoría.");
      return;
    }

    let parsedFaq: unknown = null;
    if (form.faq_json.trim().length > 0) {
      try {
        parsedFaq = JSON.parse(form.faq_json);
      } catch {
        setError("FAQ JSON inválido.");
        return;
      }
    }

    setWorking(true);
    const response = await fetch("/api/admin/tuejecutiva/executives", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name.trim(),
        slug: slugify(form.slug.trim() || form.name),
        phone: form.phone.trim(),
        company: form.company.trim(),
        specialty: form.specialty.trim() || null,
        description: form.description.trim() || null,
        whatsapp_message: form.whatsapp_message.trim() || null,
        plan: form.plan,
        experience_years:
          form.experience_years.trim().length > 0
            ? Number(form.experience_years)
            : null,
        company_website_url: form.company_website_url.trim() || null,
        photo_url: form.photo_url.trim() || null,
        company_logo_url: form.company_logo_url.trim() || null,
        faq: parsedFaq,
        coverage_all: form.coverage_all,
        category_ids: form.category_ids,
        region_ids: form.coverage_all ? [] : form.region_ids,
        submission_id: submission.id,
        mark_submission_approved: form.mark_submission_approved,
      }),
    });
    const payload = await response.json().catch(() => ({}));
    setWorking(false);

    if (!response.ok) {
      setError(payload.error ?? "No se pudo crear ejecutiva.");
      return;
    }

    setMessage("Ejecutiva creada correctamente. Ya puedes volver al listado.");
  }

  async function onDiscardSubmission() {
    if (submission.status === "approved") {
      setError("Esta postulación ya está aprobada y no se puede descartar.");
      return;
    }

    const confirmed = window.confirm(
      "¿Descartar esta postulación? Se marcará como rechazada y saldrá del listado de pendientes."
    );
    if (!confirmed) return;

    setWorking(true);
    setError(null);
    setMessage(null);

    const response = await fetch(`/api/admin/tuejecutiva/submissions/${submission.id}/discard`, {
      method: "POST",
    });
    const payload = await response.json().catch(() => ({}));
    setWorking(false);

    if (!response.ok) {
      setError(payload.error ?? "No se pudo descartar la postulación.");
      return;
    }

    router.push("/admin/tuejecutiva?discarded=1");
    router.refresh();
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="section-title" style={{ fontSize: 20 }}>
            Revisar postulación
          </h1>
          <p className="section-desc">
            Formulario precargado desde onboarding para crear la ejecutiva.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={submission.status} />
          {submission.status !== "approved" ? (
            <button
              type="button"
              className="admin-btn admin-btn-danger admin-btn-sm"
              onClick={onDiscardSubmission}
              disabled={working}
            >
              Descartar postulación
            </button>
          ) : null}
          <Link href="/admin/tuejecutiva" className="admin-btn admin-btn-secondary admin-btn-sm no-underline">
            Volver al listado
          </Link>
        </div>
      </div>

      {message ? <div className="admin-alert admin-alert-success">{message}</div> : null}
      {error ? <div className="admin-alert admin-alert-error">{error}</div> : null}

      <div className="admin-card">
        <h2 className="section-title">Resumen onboarding</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <p className="m-0 text-sm"><strong>Nombre:</strong> {submission.full_name}</p>
          <p className="m-0 text-sm"><strong>Email:</strong> {submission.email}</p>
          <p className="m-0 text-sm"><strong>Teléfono:</strong> {submission.phone}</p>
          <p className="m-0 text-sm"><strong>Empresa:</strong> {submission.company}</p>
        </div>
      </div>

      <form className="admin-card" onSubmit={onCreateExecutive}>
        <h2 className="section-title">Crear ejecutiva</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="admin-field">
            <label className="admin-label">Nombre</label>
            <input className="admin-input" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} required />
          </div>
          <div className="admin-field">
            <label className="admin-label">Slug</label>
            <input className="admin-input" value={form.slug} onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))} required />
          </div>
          <div className="admin-field">
            <label className="admin-label">Teléfono</label>
            <input className="admin-input" value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} required />
          </div>
          <div className="admin-field">
            <label className="admin-label">Empresa</label>
            <input className="admin-input" value={form.company} onChange={(e) => setForm((prev) => ({ ...prev, company: e.target.value }))} required />
          </div>
          <div className="admin-field">
            <label className="admin-label">Especialidad</label>
            <input className="admin-input" value={form.specialty} onChange={(e) => setForm((prev) => ({ ...prev, specialty: e.target.value }))} />
          </div>
          <div className="admin-field">
            <label className="admin-label">Plan</label>
            <select className="admin-input" value={form.plan} onChange={(e) => setForm((prev) => ({ ...prev, plan: e.target.value as "bronce" | "plata" | "oro" }))}>
              <option value="bronce">Bronce</option>
              <option value="plata">Plata</option>
              <option value="oro">Oro</option>
            </select>
          </div>
          <div className="admin-field">
            <label className="admin-label">Años experiencia</label>
            <input className="admin-input" value={form.experience_years} onChange={(e) => setForm((prev) => ({ ...prev, experience_years: e.target.value }))} />
          </div>
          <div className="admin-field">
            <label className="admin-label">Web empresa</label>
            <input className="admin-input" placeholder="https://..." value={form.company_website_url} onChange={(e) => setForm((prev) => ({ ...prev, company_website_url: e.target.value }))} />
          </div>
          <div className="admin-field">
            <label className="admin-label">Foto URL</label>
            <input className="admin-input" value={form.photo_url} onChange={(e) => setForm((prev) => ({ ...prev, photo_url: e.target.value }))} />
          </div>
          <div className="admin-field">
            <label className="admin-label">Logo URL</label>
            <input className="admin-input" value={form.company_logo_url} onChange={(e) => setForm((prev) => ({ ...prev, company_logo_url: e.target.value }))} />
          </div>
        </div>

        <div className="mt-4 admin-field">
          <label className="admin-label">Descripción</label>
          <textarea className="admin-input" rows={3} value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
        </div>
        <div className="mt-4 admin-field">
          <label className="admin-label">Mensaje WhatsApp</label>
          <textarea className="admin-input" rows={2} value={form.whatsapp_message} onChange={(e) => setForm((prev) => ({ ...prev, whatsapp_message: e.target.value }))} />
        </div>
        <div className="mt-4 admin-field">
          <label className="admin-label">FAQ (JSON)</label>
          <textarea className="admin-input font-mono text-xs" rows={8} value={form.faq_json} onChange={(e) => setForm((prev) => ({ ...prev, faq_json: e.target.value }))} />
        </div>

        <div className="mt-4 rounded-lg border p-4" style={{ background: "var(--admin-surface-raised)", borderColor: "var(--admin-border)" }}>
          <p className="m-0 text-xs font-semibold" style={{ color: "var(--admin-text-secondary)" }}>Categorías</p>
          <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3">
            {categories.map((category) => (
              <label key={category.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-white/5" style={{ color: "var(--admin-text)" }}>
                <input type="checkbox" checked={form.category_ids.includes(category.id)} onChange={() => toggleCategory(category.id)} className="accent-[var(--admin-accent)]" />
                {category.name}
              </label>
            ))}
          </div>
        </div>

        <label className="mt-4 flex cursor-pointer items-center gap-2 text-xs" style={{ color: "var(--admin-text)" }}>
          <input type="checkbox" checked={form.coverage_all} onChange={(e) => setForm((prev) => ({ ...prev, coverage_all: e.target.checked }))} className="accent-[var(--admin-accent)]" />
          Cobertura nacional (si activas esto, ignora regiones)
        </label>

        <div className="mt-4 rounded-lg border p-4" style={{ background: "var(--admin-surface-raised)", borderColor: "var(--admin-border)" }}>
          <p className="m-0 text-xs font-semibold" style={{ color: "var(--admin-text-secondary)" }}>Regiones</p>
          <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3">
            {regions.map((region) => (
              <label key={region.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-white/5" style={{ color: form.coverage_all ? "var(--admin-text-muted)" : "var(--admin-text)" }}>
                <input type="checkbox" checked={form.region_ids.includes(region.id)} onChange={() => toggleRegion(region.id)} disabled={form.coverage_all} className="accent-[var(--admin-accent)]" />
                {region.name} ({region.code})
              </label>
            ))}
          </div>
        </div>

        <label className="mt-4 flex cursor-pointer items-center gap-2 text-xs" style={{ color: "var(--admin-text)" }}>
          <input type="checkbox" checked={form.mark_submission_approved} onChange={(e) => setForm((prev) => ({ ...prev, mark_submission_approved: e.target.checked }))} className="accent-[var(--admin-accent)]" />
          Marcar postulación como approved al crear
        </label>

        <button disabled={working || !canSubmit} className="admin-btn admin-btn-primary mt-5" type="submit">
          {working ? "Creando..." : "Crear ejecutiva"}
        </button>
      </form>

      <form className="admin-card" onSubmit={onCreateCategory}>
        <h2 className="section-title">Crear categoría (si no existe)</h2>
        <p className="section-desc">Úsalo antes de crear la ejecutiva y luego selecciónala arriba.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="admin-field">
            <label className="admin-label">Nombre</label>
            <input className="admin-input" value={newCategory.name} onChange={(e) => setNewCategory((prev) => ({ ...prev, name: e.target.value }))} required />
          </div>
          <div className="admin-field">
            <label className="admin-label">Slug (opcional)</label>
            <input className="admin-input" value={newCategory.slug} onChange={(e) => setNewCategory((prev) => ({ ...prev, slug: e.target.value }))} />
          </div>
          <div className="admin-field">
            <label className="admin-label">Descripción</label>
            <input className="admin-input" value={newCategory.description} onChange={(e) => setNewCategory((prev) => ({ ...prev, description: e.target.value }))} />
          </div>
        </div>
        <button disabled={working} className="admin-btn admin-btn-secondary mt-4" type="submit">
          {working ? "Guardando..." : "Crear categoría"}
        </button>
      </form>
    </div>
  );
}
