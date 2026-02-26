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
  const siteUrl = process.env.NEXT_PUBLIC_TUEJECUTIVA_SITE_URL || "https://tuejecutiva.cl";

  const [
    { data: categories, error: categoriesError },
    { data: regions, error: regionsError },
    { data: executives, error: executivesError },
    { data: submissions, error: submissionsError },
  ] = await Promise.all([
    tuejecutiva.from("categories").select("id, slug, name").order("name", { ascending: true }),
    tuejecutiva.from("regions").select("id, code, name").order("name", { ascending: true }),
    tuejecutiva
      .from("executives")
      .select(
        "id, name, slug, phone, company, plan, status, verified, created_at, executive_categories(categories(id,name,slug)), executive_regions(regions(id,code,name))"
      )
      .order("created_at", { ascending: false })
      .limit(200),
    tuejecutiva
      .from("onboarding_submissions")
      .select("id, token_id, full_name, email, phone, company, status, created_at")
      .in("status", ["pending", "reviewed"])
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  const errors = [categoriesError?.message, regionsError?.message, executivesError?.message, submissionsError?.message].filter(Boolean);

  return (
    <div>
      <div className="mb-6">
        <h1 className="section-title" style={{ fontSize: 20 }}>TuEjecutiva</h1>
        <p className="section-desc">Tokens de onboarding, creación manual de ejecutivas y postulaciones pendientes.</p>
      </div>
      {errors.length > 0 ? <div className="admin-alert admin-alert-error mb-4">Error: {errors.join(" | ")}</div> : null}
      <TuejecutivaAdminClient
        onboardingAdminBaseUrl={`${siteUrl}/admin`}
        initialCategories={(categories ?? []) as Category[]}
        initialRegions={(regions ?? []) as Region[]}
        initialSubmissions={(submissions ?? []) as SubmissionRow[]}
        initialExecutives={normalizeExecutiveRows((executives ?? []) as unknown[])}
      />
    </div>
  );
}
