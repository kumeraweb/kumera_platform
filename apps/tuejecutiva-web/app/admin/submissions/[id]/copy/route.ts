import { NextResponse, type NextRequest } from "next/server";
import { getSubmissionDetail } from "@/lib/onboarding";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const submission = await getSubmissionDetail(id);
  if (!submission) {
    return NextResponse.json({ error: "Submission no encontrada." }, { status: 404 });
  }

  const categories = submission.onboarding_submission_categories
    .map((item) => item.categories)
    .filter(Boolean);
  const regions = submission.onboarding_submission_regions
    .map((item) => item.regions)
    .filter(Boolean);

  const copyPayload = {
    full_name: submission.full_name,
    email: submission.email,
    phone: submission.phone,
    company: submission.company,
    experience_years: submission.experience_years,
    specialty: submission.specialty,
    description: submission.description,
    whatsapp_message: submission.whatsapp_message,
    coverage_all: submission.coverage_all,
    custom_category: submission.custom_category,
    categories: categories.map((category) => category?.name),
    regions: regions.map((region) => region?.name),
  };

  return NextResponse.json(copyPayload);
}
