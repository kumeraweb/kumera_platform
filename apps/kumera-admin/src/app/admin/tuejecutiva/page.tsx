import { requireAdminPage, ROLE } from "@/lib/auth";
import { createTuejecutivaServiceClient } from "@/lib/db";
import TuejecutivaAdminClient from "./ui-client";

export const dynamic = "force-dynamic";

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

function normalizeExecutiveRows(rows: unknown[]): ExecutiveRow[] {
  return rows.map((row) => {
    const value = row as {
      id: string;
      name: string;
      slug: string;
      phone: string;
      company: string;
      plan: "bronce" | "plata" | "oro" | null;
      status: "draft" | "pending" | "active" | "inactive";
      verified: boolean;
      created_at: string;
      executive_categories?: Array<{ categories: { id: string; name: string; slug: string } | { id: string; name: string; slug: string }[] | null }>;
      executive_regions?: Array<{ regions: { id: string; code: string; name: string } | { id: string; code: string; name: string }[] | null }>;
    };

    return {
      ...value,
      executive_categories: (value.executive_categories ?? []).map((item) => ({
        categories: Array.isArray(item.categories) ? item.categories[0] ?? null : item.categories ?? null,
      })),
      executive_regions: (value.executive_regions ?? []).map((item) => ({
        regions: Array.isArray(item.regions) ? item.regions[0] ?? null : item.regions ?? null,
      })),
    };
  });
}

export default async function TuejecutivaAdminPage() {
  await requireAdminPage([ROLE.TUEJECUTIVA]);
  const tuejecutiva = createTuejecutivaServiceClient();

  const [{ data: categories, error: categoriesError }, { data: regions, error: regionsError }, { data: executives, error: executivesError }] = await Promise.all([
    tuejecutiva.from("categories").select("id, slug, name").order("name", { ascending: true }),
    tuejecutiva.from("regions").select("id, code, name").order("name", { ascending: true }),
    tuejecutiva
      .from("executives")
      .select(
        "id, name, slug, phone, company, plan, status, verified, created_at, executive_categories(categories(id,name,slug)), executive_regions(regions(id,code,name))"
      )
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  const errors = [categoriesError?.message, regionsError?.message, executivesError?.message].filter(Boolean);

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <h2 className="m-0 text-base font-bold text-slate-100">TuEjecutiva Admin (centralizado)</h2>
      <p className="mt-1 text-xs text-slate-400">Incluye generación de token onboarding, listado y creación manual de ejecutivas.</p>
      {errors.length > 0 ? <p className="mt-2 text-sm text-red-400">Error: {errors.join(" | ")}</p> : null}
      <TuejecutivaAdminClient
        initialCategories={(categories ?? []) as Category[]}
        initialRegions={(regions ?? []) as Region[]}
        initialExecutives={normalizeExecutiveRows((executives ?? []) as unknown[])}
      />
    </section>
  );
}
