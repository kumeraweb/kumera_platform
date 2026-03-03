import { notFound } from "next/navigation";
import { requireAdminPage, ROLE } from "@/lib/auth";
import { createTuejecutivaServiceClient } from "@/lib/db";
import TuejecutivaSubmissionReviewClient from "./review-client";

export const dynamic = "force-dynamic";

type Category = { id: string; slug: string; name: string };
type Region = { id: string; code: string; name: string };

type SubmissionQueryRow = {
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
  onboarding_submission_categories?: Array<{
    categories:
      | { id: string; name: string; slug: string }
      | { id: string; name: string; slug: string }[]
      | null;
  }>;
  onboarding_submission_regions?: Array<{
    regions:
      | { id: string; code: string; name: string }
      | { id: string; code: string; name: string }[]
      | null;
  }>;
};

interface PageProps {
  params: Promise<{ id: string }>;
}

function toArray<T>(value: T | T[] | null | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export default async function TuejecutivaSubmissionReviewPage({ params }: PageProps) {
  await requireAdminPage([ROLE.TUEJECUTIVA]);
  const { id } = await params;
  const tuejecutiva = createTuejecutivaServiceClient();

  const [
    { data: submission, error: submissionError },
    { data: categories, error: categoriesError },
    { data: regions, error: regionsError },
  ] = await Promise.all([
    tuejecutiva
      .from("onboarding_submissions")
      .select(
        "id, full_name, email, phone, company, experience_years, specialty, description, whatsapp_message, photo_url, company_logo_url, faq, coverage_all, status, custom_category, onboarding_submission_categories(categories(id,name,slug)), onboarding_submission_regions(regions(id,code,name))"
      )
      .eq("id", id)
      .maybeSingle(),
    tuejecutiva.from("categories").select("id, slug, name").order("name", { ascending: true }),
    tuejecutiva.from("regions").select("id, code, name").order("name", { ascending: true }),
  ]);

  if (submissionError || !submission) {
    notFound();
  }

  if (categoriesError) {
    throw new Error(categoriesError.message);
  }

  if (regionsError) {
    throw new Error(regionsError.message);
  }

  const row = submission as SubmissionQueryRow;
  const categoryIds = (row.onboarding_submission_categories ?? [])
    .flatMap((item) => toArray(item.categories))
    .map((category) => category.id);

  const regionIds = (row.onboarding_submission_regions ?? [])
    .flatMap((item) => toArray(item.regions))
    .map((region) => region.id);

  return (
    <TuejecutivaSubmissionReviewClient
      submission={{
        id: row.id,
        full_name: row.full_name,
        email: row.email,
        phone: row.phone,
        company: row.company,
        experience_years: row.experience_years,
        specialty: row.specialty,
        description: row.description,
        whatsapp_message: row.whatsapp_message,
        photo_url: row.photo_url,
        company_logo_url: row.company_logo_url,
        faq: row.faq,
        coverage_all: row.coverage_all,
        status: row.status,
        custom_category: row.custom_category,
        category_ids: categoryIds,
        region_ids: regionIds,
      }}
      initialCategories={(categories ?? []) as Category[]}
      initialRegions={(regions ?? []) as Region[]}
    />
  );
}
