import { z } from "zod";
import { requireAdminApi, ROLE } from "@/lib/auth";
import { createLeadosServiceClient } from "@/lib/db";
import { fail, ok } from "@/lib/http";

const createClientSchema = z.object({
  name: z.string().min(1),
  notification_email: z.string().email(),
  human_forward_number: z.string().min(1),
  score_threshold: z.number().int().min(0).max(100),
  strategic_questions: z.array(z.string()).max(3),
});

export async function GET() {
  const auth = await requireAdminApi([ROLE.LEADOS]);
  if (!auth.ok) return auth.response;

  const leados = createLeadosServiceClient();
  const { data, error } = await leados.from("clients").select("*").order("created_at", { ascending: false });
  if (error) return fail(error.message, 500);
  return ok({ clients: data ?? [] });
}

export async function POST(req: Request) {
  const auth = await requireAdminApi([ROLE.LEADOS]);
  if (!auth.ok) return auth.response;

  const payload = await req.json().catch(() => null);
  const parsed = createClientSchema.safeParse(payload);
  if (!parsed.success) return fail("Invalid payload", 400);

  const leados = createLeadosServiceClient();
  const { data, error } = await leados.from("clients").insert(parsed.data).select("*").single();
  if (error) return fail(error.message, 500);
  return ok({ client: data }, 201);
}
