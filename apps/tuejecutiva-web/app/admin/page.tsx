import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createCategoryFromAdmin,
  getLatestActiveToken,
  getCategoriesForOnboarding,
  listSubmissions,
  updateSubmissionStatus,
  type OnboardingStatus,
} from "@/lib/onboarding";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

async function updateStatusAction(formData: FormData) {
  "use server";
  const submissionId = formData.get("submission_id");
  const status = formData.get("status");

  if (typeof submissionId !== "string" || typeof status !== "string") {
    return;
  }

  await updateSubmissionStatus(submissionId, status as OnboardingStatus);
  revalidatePath("/admin");
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

async function createCategoryAction(formData: FormData) {
  "use server";
  const name = formData.get("name");
  const slug = formData.get("slug");
  const description = formData.get("description");
  const icon = formData.get("icon");

  if (typeof name !== "string" || name.trim().length === 0) {
    redirect("/admin?category_error=Nombre requerido");
  }

  const finalSlug =
    typeof slug === "string" && slug.trim().length > 0
      ? slugify(slug)
      : slugify(name);

  try {
    await createCategoryFromAdmin({
      name: name.trim(),
      slug: finalSlug,
      description: typeof description === "string" ? description : null,
      icon: typeof icon === "string" ? icon : null,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo crear la categoría";
    redirect(`/admin?category_error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/admin");
  redirect("/admin?category_ok=1");
}

export default async function AdminHomePage({ searchParams }: PageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const tokenParam = resolvedSearchParams.token;
  const emailParam = resolvedSearchParams.email;
  const expiresAtParam = resolvedSearchParams.expires_at;
  const reusedParam = resolvedSearchParams.reused;

  const submissions = await listSubmissions();
  const categories = await getCategoriesForOnboarding();
  const activeToken = await getLatestActiveToken();
  const categoryOk = resolvedSearchParams.category_ok === "1";
  const categoryError =
    typeof resolvedSearchParams.category_error === "string"
      ? resolvedSearchParams.category_error
      : "";

  const tokenValue =
    typeof tokenParam === "string"
      ? tokenParam
      : activeToken?.token || "";
  const tokenEmail =
    typeof emailParam === "string"
      ? emailParam
      : activeToken?.email || "";
  const tokenExpiresAt =
    typeof expiresAtParam === "string"
      ? expiresAtParam
      : activeToken?.expires_at || "";
  const tokenLink = tokenValue
    ? `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.tuejecutiva.cl"}/onboarding/${tokenValue}`
    : "";

  return (
    <main className="bg-slate-50 px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Onboarding</h1>
            <p className="mt-2 text-sm text-slate-600">
              Listado de submissions de onboarding.
            </p>
          </div>
          <form action="/admin/logout" method="post">
            <button
              type="submit"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Cerrar sesión
            </button>
          </form>
        </div>

        <section className="mt-8 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Generar link de onboarding
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Se reutiliza un token activo si existe para el email indicado.
          </p>
          <form
            action="/admin/tokens"
            method="post"
            className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3"
          >
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700">
                Email (opcional)
              </label>
              <input
                type="email"
                name="email"
                placeholder="ej. ejecutiva@empresa.cl"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Expira en (días)
              </label>
              <input
                type="number"
                name="expires_in_days"
                min={1}
                max={30}
                defaultValue={7}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-3">
              <button
                type="submit"
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Generar token
              </button>
            </div>
          </form>

          {tokenLink ? (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              <div className="font-semibold">
                {reusedParam === "1" ? "Token activo reutilizado" : "Token listo"}
              </div>
              <div className="mt-1 break-all">{tokenLink}</div>
              <div className="mt-2 text-xs text-emerald-700">
                Email: {tokenEmail || "—"} · Expira:{" "}
                {tokenExpiresAt
                  ? new Date(tokenExpiresAt).toLocaleString("es-CL")
                  : "—"}
              </div>
            </div>
          ) : (
            <div className="mt-4 text-sm text-slate-500">
              No hay tokens activos.
            </div>
          )}
        </section>

        <section className="mt-8 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">Categorías</h2>
          <p className="mt-1 text-sm text-slate-600">
            Crea categorías nuevas para el catálogo público.
          </p>

          {categoryOk ? (
            <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              Categoría creada correctamente.
            </div>
          ) : null}
          {categoryError ? (
            <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {categoryError}
            </div>
          ) : null}

          <form action={createCategoryAction} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Nombre *</span>
              <input
                name="name"
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Slug (opcional)</span>
              <input
                name="slug"
                placeholder="si no lo escribes, se genera desde el nombre"
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </label>
            <label className="text-sm sm:col-span-2">
              <span className="mb-1 block font-medium text-slate-700">Descripción</span>
              <textarea
                name="description"
                rows={2}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Ícono</span>
              <input
                name="icon"
                placeholder="ej: 🚑"
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </label>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Crear categoría
              </button>
            </div>
          </form>

          <div className="mt-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Categorías actuales
            </h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {categories.map((category) => (
                <span
                  key={category.id}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700"
                >
                  {category.name} ({category.slug})
                </span>
              ))}
            </div>
          </div>
        </section>

        <div className="mt-8 overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Empresa</th>
                <th className="px-4 py-3">Teléfono</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Creado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {submissions.map((submission) => (
                <tr key={submission.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {submission.full_name}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {submission.company}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {submission.phone}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {submission.status}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(submission.created_at).toLocaleDateString("es-CL")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-col items-end gap-2">
                      <Link
                        href={`/admin/submissions/${submission.id}`}
                        className="text-emerald-600 hover:underline"
                      >
                        Ver detalle
                      </Link>
                      <Link
                        href={`/admin/submissions/${submission.id}/publish`}
                        className="text-slate-700 hover:underline"
                      >
                        Crear ejecutiva
                      </Link>
                      <form action={updateStatusAction} className="flex items-center gap-2">
                        <input
                          type="hidden"
                          name="submission_id"
                          value={submission.id}
                        />
                        <select
                          name="status"
                          defaultValue={submission.status}
                          className="rounded-md border border-gray-300 px-2 py-1 text-xs"
                        >
                          <option value="pending">pending</option>
                          <option value="reviewed">reviewed</option>
                          <option value="approved">approved</option>
                          <option value="rejected">rejected</option>
                        </select>
                        <button
                          type="submit"
                          className="rounded-md border border-emerald-600 px-2 py-1 text-xs text-emerald-700"
                        >
                          Guardar
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {submissions.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-sm text-slate-500"
                  >
                    No hay submissions registradas.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
