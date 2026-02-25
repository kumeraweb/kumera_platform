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

type Props = {
  initialCategories: Category[];
  initialRegions: Region[];
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

export default function TuejecutivaAdminClient({
  initialCategories,
  initialRegions,
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
    <div className="mt-4 grid gap-4">
      {message ? <p className="text-sm font-medium text-emerald-400">{message}</p> : null}
      {error ? <p className="text-sm font-medium text-red-400">{error}</p> : null}

      <form className="grid gap-2 rounded-xl border border-slate-800 bg-slate-900 p-4" onSubmit={onCreateToken}>
        <h3 className="m-0 text-sm font-bold text-slate-100">PASO 1 · Generar token onboarding</h3>
        <input
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/20"
          type="email"
          placeholder="ejecutiva@empresa.cl (opcional)"
          value={tokenForm.email}
          onChange={(e) => setTokenForm((prev) => ({ ...prev, email: e.target.value }))}
        />
        <input
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/20"
          type="number"
          min={1}
          max={30}
          value={tokenForm.expires_in_days}
          onChange={(e) => setTokenForm((prev) => ({ ...prev, expires_in_days: Number(e.target.value) }))}
          required
        />
        <button className="w-fit cursor-pointer rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:bg-slate-700" type="submit">
          Generar token
        </button>

        {tokenResult ? (
          <div className="mt-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
            <p className="m-0 font-semibold">{tokenResult.reused ? "Token activo reutilizado" : "Token creado"}</p>
            <p className="m-0.5 break-all">{tokenResult.link}</p>
            <p className="m-0.5">Email: {tokenResult.email ?? "—"}</p>
            <p className="m-0.5">Expira: {new Date(tokenResult.expires_at).toLocaleString("es-CL")}</p>
          </div>
        ) : null}
      </form>

      <form className="grid gap-2 rounded-xl border border-slate-800 bg-slate-900 p-4" onSubmit={onCreateExecutive}>
        <h3 className="m-0 text-sm font-bold text-slate-100">PASO 2 · Crear ejecutiva manual</h3>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <input
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/20"
            placeholder="Nombre"
            value={executiveForm.name}
            onChange={(e) => setExecutiveForm((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
          <input
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/20"
            placeholder="Slug (opcional)"
            value={executiveForm.slug}
            onChange={(e) => setExecutiveForm((prev) => ({ ...prev, slug: e.target.value }))}
          />
          <input
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/20"
            placeholder="Teléfono"
            value={executiveForm.phone}
            onChange={(e) => setExecutiveForm((prev) => ({ ...prev, phone: e.target.value }))}
            required
          />
          <input
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/20"
            placeholder="Empresa"
            value={executiveForm.company}
            onChange={(e) => setExecutiveForm((prev) => ({ ...prev, company: e.target.value }))}
            required
          />
          <input
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/20"
            placeholder="Especialidad"
            value={executiveForm.specialty}
            onChange={(e) => setExecutiveForm((prev) => ({ ...prev, specialty: e.target.value }))}
          />
          <select
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/20"
            value={executiveForm.plan}
            onChange={(e) =>
              setExecutiveForm((prev) => ({ ...prev, plan: e.target.value as "bronce" | "plata" | "oro" }))
            }
          >
            <option value="bronce">bronce</option>
            <option value="plata">plata</option>
            <option value="oro">oro</option>
          </select>
          <input
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/20"
            placeholder="Años experiencia (opcional)"
            value={executiveForm.experience_years}
            onChange={(e) => setExecutiveForm((prev) => ({ ...prev, experience_years: e.target.value }))}
          />
          <input
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/20 md:col-span-2"
            placeholder="Sitio web empresa (https://...)"
            value={executiveForm.company_website_url}
            onChange={(e) => setExecutiveForm((prev) => ({ ...prev, company_website_url: e.target.value }))}
          />
        </div>
        <textarea
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/20"
          placeholder="Descripción"
          rows={3}
          value={executiveForm.description}
          onChange={(e) => setExecutiveForm((prev) => ({ ...prev, description: e.target.value }))}
        />
        <textarea
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/20"
          placeholder="Mensaje WhatsApp"
          rows={2}
          value={executiveForm.whatsapp_message}
          onChange={(e) => setExecutiveForm((prev) => ({ ...prev, whatsapp_message: e.target.value }))}
        />

        <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
          <p className="m-0 text-xs font-semibold text-slate-300">Categorías</p>
          <div className="mt-2 grid grid-cols-1 gap-1 md:grid-cols-2">
            {initialCategories.map((category) => (
              <label key={category.id} className="flex items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={executiveForm.category_ids.includes(category.id)}
                  onChange={() => toggleCategory(category.id)}
                />
                {category.name}
              </label>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 text-xs text-slate-300">
          <input
            type="checkbox"
            checked={executiveForm.coverage_all}
            onChange={(e) => setExecutiveForm((prev) => ({ ...prev, coverage_all: e.target.checked }))}
          />
          Cobertura nacional (si activas esto, ignora regiones)
        </label>

        <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
          <p className="m-0 text-xs font-semibold text-slate-300">Regiones</p>
          <div className="mt-2 grid grid-cols-1 gap-1 md:grid-cols-2">
            {initialRegions.map((region) => (
              <label key={region.id} className="flex items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={executiveForm.region_ids.includes(region.id)}
                  onChange={() => toggleRegion(region.id)}
                  disabled={executiveForm.coverage_all}
                />
                {region.name} ({region.code})
              </label>
            ))}
          </div>
        </div>

        <button className="w-fit cursor-pointer rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:bg-slate-700" type="submit">
          Crear ejecutiva
        </button>
      </form>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <h3 className="m-0 text-sm font-bold text-slate-100">Ejecutivas actuales</h3>
        <div className="mt-2 overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="border-b border-slate-700 px-2 py-2 text-left text-xs font-bold tracking-wide text-slate-400">Nombre</th>
                <th className="border-b border-slate-700 px-2 py-2 text-left text-xs font-bold tracking-wide text-slate-400">Empresa</th>
                <th className="border-b border-slate-700 px-2 py-2 text-left text-xs font-bold tracking-wide text-slate-400">Plan</th>
                <th className="border-b border-slate-700 px-2 py-2 text-left text-xs font-bold tracking-wide text-slate-400">Estado</th>
                <th className="border-b border-slate-700 px-2 py-2 text-left text-xs font-bold tracking-wide text-slate-400">Categorías</th>
                <th className="border-b border-slate-700 px-2 py-2 text-left text-xs font-bold tracking-wide text-slate-400">Regiones</th>
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
                    <td className="border-b border-slate-800 px-2 py-2 text-slate-200">
                      <p className="m-0 font-medium">{row.name}</p>
                      <p className="m-0 text-xs text-slate-400">/{row.slug}</p>
                    </td>
                    <td className="border-b border-slate-800 px-2 py-2 text-slate-200">{row.company}</td>
                    <td className="border-b border-slate-800 px-2 py-2 text-slate-200">{row.plan ?? "-"}</td>
                    <td className="border-b border-slate-800 px-2 py-2 text-slate-200">
                      {row.status} · {row.verified ? "verificada" : "sin verificar"}
                    </td>
                    <td className="border-b border-slate-800 px-2 py-2 text-slate-300">{categories || "-"}</td>
                    <td className="border-b border-slate-800 px-2 py-2 text-slate-300">{regions || "-"}</td>
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
