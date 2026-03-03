import { requireAdminPage, ROLE } from "@/lib/auth";
import { createTuejecutivaServiceClient } from "@/lib/db";
import TuejecutivaAdminClient from "./ui-client";

export const dynamic = "force-dynamic";

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

  const [
    { data: executives, error: executivesError },
    { data: submissions, error: submissionsError },
  ] = await Promise.all([
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

  const errors = [executivesError?.message, submissionsError?.message].filter(Boolean);

  return (
    <div>
      <div className="mb-6">
        <h1 className="section-title" style={{ fontSize: 20 }}>TuEjecutiva</h1>
        <p className="section-desc">Genera tokens, revisa postulaciones pendientes y administra ejecutivas creadas.</p>
      </div>
      {errors.length > 0 ? <div className="admin-alert admin-alert-error mb-4">Error: {errors.join(" | ")}</div> : null}
      <TuejecutivaAdminClient
        initialSubmissions={(submissions ?? []) as SubmissionRow[]}
        initialExecutives={normalizeExecutiveRows((executives ?? []) as unknown[])}
      />
    </div>
  );
}
