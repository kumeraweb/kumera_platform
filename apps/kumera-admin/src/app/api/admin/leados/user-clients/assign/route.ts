import { z } from "zod";
import { requireAdminApi, ROLE } from "@/lib/auth";
import { createLeadosServiceClient } from "@/lib/db";
import { fail, ok } from "@/lib/http";

const assignSchema = z.object({
  user_id: z.string().uuid(),
  client_id: z.string().uuid(),
});

export async function POST(req: Request) {
  const auth = await requireAdminApi([ROLE.LEADOS]);
  if (!auth.ok) return auth.response;

  const payload = await req.json().catch(() => null);
  const parsed = assignSchema.safeParse(payload);
  if (!parsed.success) return fail("Invalid payload", 400);

  const leados = createLeadosServiceClient();
  const { data, error } = await leados
    .from("user_clients")
    .upsert(parsed.data, { onConflict: "user_id,client_id" })
    .select("*")
    .single();

  if (error) return fail(error.message, 500);
  return ok({ user_client: data }, 201);
}
