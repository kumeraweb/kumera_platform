import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCategoriesForOnboarding,
  getRegionsForOnboarding,
  getSubmissionDetail,
} from "@/lib/onboarding";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export default async function PublishSubmissionPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const ok = resolvedSearchParams.ok === "1";
  const executiveId =
    typeof resolvedSearchParams.executive_id === "string"
      ? resolvedSearchParams.executive_id
      : "";
  const errorMessage =
    typeof resolvedSearchParams.error === "string"
      ? resolvedSearchParams.error
      : "";

  const [submission, categories, regions] = await Promise.all([
    getSubmissionDetail(id),
    getCategoriesForOnboarding(),
    getRegionsForOnboarding(),
  ]);

  if (!submission) {
    notFound();
  }

  const selectedCategoryIds = new Set(
    submission.onboarding_submission_categories
      .map((item) => item.categories?.id)
      .filter((value): value is string => Boolean(value))
  );

  const selectedRegionIds = new Set(
    submission.onboarding_submission_regions
      .map((item) => item.regions?.id)
      .filter((value): value is string => Boolean(value))
  );

  const defaultSlug = slugify(submission.full_name);
  const today = new Date().toISOString().slice(0, 10);
  const faqJsonDefault = JSON.stringify(
    Array.isArray(submission.faq) ? submission.faq : [],
    null,
    2
  );
  const plansJsonDefault = JSON.stringify(
    [
      {
        name: "Plan base",
        price_from: "",
        target: "",
        description: "",
        features: [],
        active: true,
      },
    ],
    null,
    2
  );

  return (
    <main className="bg-slate-50 px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/admin" className="text-sm text-emerald-600 hover:underline">
              ← Volver a onboarding
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">
              Publicar ejecutiva desde onboarding
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Submission: {submission.full_name} · {submission.company}
            </p>
          </div>
          <Link
            href={`/admin/submissions/${submission.id}`}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            Ver detalle
          </Link>
        </div>

        {ok ? (
          <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Ejecutiva creada correctamente.
            {executiveId ? ` ID: ${executiveId}` : ""}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mt-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            Error: {errorMessage}
          </div>
        ) : null}

        <form
          action={`/admin/submissions/${submission.id}/publish/create`}
          method="post"
          encType="multipart/form-data"
          className="mt-8 space-y-6"
        >
          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">Datos base</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block font-medium text-slate-700">Nombre *</span>
                <input
                  name="name"
                  required
                  defaultValue={submission.full_name}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-slate-700">Slug *</span>
                <input
                  name="slug"
                  required
                  defaultValue={defaultSlug}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-slate-700">Teléfono *</span>
                <input
                  name="phone"
                  required
                  defaultValue={submission.phone}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-slate-700">Empresa *</span>
                <input
                  name="company"
                  required
                  defaultValue={submission.company}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-slate-700">Años experiencia</span>
                <input
                  name="experience_years"
                  type="number"
                  min={0}
                  max={70}
                  defaultValue={submission.experience_years ?? ""}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-slate-700">Especialidad</span>
                <input
                  name="specialty"
                  defaultValue={submission.specialty ?? ""}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </label>
              <label className="text-sm sm:col-span-2">
                <span className="mb-1 block font-medium text-slate-700">Descripción</span>
                <textarea
                  name="description"
                  defaultValue={submission.description ?? ""}
                  rows={4}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </label>
              <label className="text-sm sm:col-span-2">
                <span className="mb-1 block font-medium text-slate-700">Mensaje WhatsApp</span>
                <textarea
                  name="whatsapp_message"
                  defaultValue={submission.whatsapp_message ?? ""}
                  rows={2}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-slate-700">Foto URL</span>
                <input
                  name="photo_url"
                  defaultValue={submission.photo_url ?? ""}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-slate-700">Subir foto (opcional)</span>
                <input
                  type="file"
                  name="photo_file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
                <span className="mt-1 block text-xs text-slate-500">
                  Si subes archivo, reemplaza Foto URL.
                </span>
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-slate-700">Logo URL</span>
                <input
                  name="company_logo_url"
                  defaultValue={submission.company_logo_url ?? ""}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-slate-700">Subir logo (opcional)</span>
                <input
                  type="file"
                  name="company_logo_file"
                  accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
                <span className="mt-1 block text-xs text-slate-500">
                  Si subes archivo, reemplaza Logo URL.
                </span>
              </label>
              <label className="text-sm sm:col-span-2">
                <span className="mb-1 block font-medium text-slate-700">Web empresa</span>
                <input
                  name="company_website_url"
                  placeholder="https://empresa.cl"
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </label>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">Publicación</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <label className="text-sm">
                <span className="mb-1 block font-medium text-slate-700">Plan *</span>
                <select
                  name="plan"
                  defaultValue="bronce"
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="bronce">bronce</option>
                  <option value="plata">plata</option>
                  <option value="oro">oro</option>
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-slate-700">Status *</span>
                <select
                  name="status"
                  defaultValue="active"
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="active">active</option>
                  <option value="pending">pending</option>
                  <option value="inactive">inactive</option>
                  <option value="draft">draft</option>
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-slate-700">Fecha verificación</span>
                <input
                  name="verified_date"
                  type="date"
                  defaultValue={today}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-700">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" name="verified" defaultChecked />
                Verificada
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" name="coverage_all" defaultChecked={submission.coverage_all} />
                Cobertura todo Chile
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" name="mark_approved" defaultChecked />
                Marcar submission como approved
              </label>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">Contenido público adicional</h2>
            <p className="mt-1 text-sm text-slate-600">
              Aquí agregas información que normalmente no viene completa desde onboarding.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-4">
              <label className="text-sm">
                <span className="mb-1 block font-medium text-slate-700">FAQ (JSON array)</span>
                <textarea
                  name="faq_json"
                  defaultValue={faqJsonDefault}
                  rows={8}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-xs"
                />
                <span className="mt-1 block text-xs text-slate-500">
                  Formato sugerido:{" "}
                  <code>[&#123;&quot;question&quot;:&quot;...&quot;,&quot;answer&quot;:&quot;...&quot;&#125;]</code>
                </span>
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-slate-700">Planes comerciales (JSON array)</span>
                <textarea
                  name="plans_json"
                  defaultValue={plansJsonDefault}
                  rows={10}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-xs"
                />
                <span className="mt-1 block text-xs text-slate-500">
                  Cada plan: {"{"}name, price_from, target, description, features[], active{"}"}
                </span>
              </label>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">Categorías *</h2>
            <p className="mt-1 text-sm text-slate-600">Selecciona al menos una.</p>
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {categories.map((category) => (
                <label key={category.id} className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    name="category_ids"
                    value={category.id}
                    defaultChecked={selectedCategoryIds.has(category.id)}
                  />
                  {category.name} <span className="text-slate-400">({category.slug})</span>
                </label>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">Regiones</h2>
            <p className="mt-1 text-sm text-slate-600">
              Si la ejecutiva es de cobertura nacional, estas regiones se ignorarán.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {regions.map((region) => (
                <label key={region.id} className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    name="region_ids"
                    value={region.id}
                    defaultChecked={selectedRegionIds.has(region.id)}
                  />
                  {region.name} <span className="text-slate-400">({region.code})</span>
                </label>
              ))}
            </div>
          </section>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Crear ejecutiva en tabla final
            </button>
            <Link
              href={`/admin/submissions/${submission.id}`}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
