import { requireAdminApi, ROLE } from "@/lib/auth";
import { createTuejecutivaServiceClient } from "@/lib/db";
import { fail, ok } from "@/lib/http";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_req: Request, { params }: RouteParams) {
  const auth = await requireAdminApi([ROLE.TUEJECUTIVA]);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  if (!id) return fail("Missing submission id", 400);

  const tuejecutiva = createTuejecutivaServiceClient();

  const { data: submission, error: submissionError } = await tuejecutiva
    .from("onboarding_submissions")
    .select("id, status")
    .eq("id", id)
    .maybeSingle();

  if (submissionError) return fail(submissionError.message, 500);
  if (!submission) return fail("Submission not found", 404);

  if (submission.status === "approved") {
    return fail("Cannot discard an approved submission", 409);
  }

  if (submission.status === "rejected") {
    return ok({ submission: { id: submission.id, status: submission.status }, alreadyDiscarded: true });
  }

  const { data: updated, error: updateError } = await tuejecutiva
    .from("onboarding_submissions")
    .update({ status: "rejected" })
    .eq("id", id)
    .select("id, status")
    .single();

  if (updateError) return fail(updateError.message, 500);

  return ok({ submission: updated, discarded: true });
}
