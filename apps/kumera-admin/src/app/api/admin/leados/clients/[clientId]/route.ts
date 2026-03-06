import { z } from "zod";
import { requireAdminApi, ROLE } from "@/lib/auth";
import { createLeadosServiceClient } from "@/lib/db";
import { fail, ok } from "@/lib/http";

const optionalEmail = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}, z.string().email().optional());

const optionalTemplate = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}, z.string().min(1).optional());

const updateClientSchema = z.object({
  notification_email: z.string().email().optional(),
  human_forward_number: z.string().min(1).optional(),
  priority_contact_email: optionalEmail,
  human_required_message_template: optionalTemplate,
  close_client_no_response_template: optionalTemplate,
  close_attended_other_line_template: optionalTemplate,
  score_threshold: z.number().int().min(0).max(100).optional(),
  strategic_questions: z.array(z.string()).max(3).optional(),
  billing_plan_code: z.string().min(1).optional(),
  billing_plan_name: z.string().min(1).optional(),
  monthly_inbound_limit: z.number().int().min(100).max(1000000).optional(),
  monthly_ai_checks_limit: z.number().int().min(50).max(1000000).optional(),
  enforce_monthly_limits: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ clientId: string }> },
) {
  const auth = await requireAdminApi([ROLE.KUMERA_MESSAGING, ROLE.LEADOS]);
  if (!auth.ok) return auth.response;

  const payload = await req.json().catch(() => null);
  const parsed = updateClientSchema.safeParse(payload);
  if (!parsed.success) return fail("Invalid payload", 400);

  const { clientId } = await params;
  const leados = createLeadosServiceClient();
  const { data, error } = await leados
    .from("clients")
    .update(parsed.data)
    .eq("id", clientId)
    .select("*")
    .maybeSingle();

  if (error) return fail(error.message, 500);
  if (!data) return fail("Client not found", 404);

  return ok({ client: data });
}
