import { z } from "zod";
import { requireAdminApi, ROLE } from "@/lib/auth";
import { createLeadosServiceClient } from "@/lib/db";
import { encryptLeadosSecret } from "@/lib/crypto";
import { fail, ok } from "@/lib/http";

const createChannelSchema = z.object({
  client_id: z.string().uuid(),
  phone_number_id: z.string().min(1),
  waba_id: z.string().optional().nullable(),
  meta_access_token: z.string().min(1),
  meta_app_secret: z.string().min(1),
  is_active: z.boolean().default(true),
});

export async function POST(req: Request) {
  const auth = await requireAdminApi([ROLE.LEADOS]);
  if (!auth.ok) return auth.response;

  const payload = await req.json().catch(() => null);
  const parsed = createChannelSchema.safeParse(payload);
  if (!parsed.success) return fail("Invalid payload", 400);

  const body = parsed.data;
  const leados = createLeadosServiceClient();
  const { data, error } = await leados
    .from("client_channels")
    .insert({
      client_id: body.client_id,
      phone_number_id: body.phone_number_id,
      waba_id: body.waba_id ?? null,
      is_active: body.is_active,
      meta_access_token_enc: encryptLeadosSecret(body.meta_access_token),
      meta_app_secret_enc: encryptLeadosSecret(body.meta_app_secret),
      encryption_version: 1,
    })
    .select("*")
    .single();

  if (error) return fail(error.message, 500);
  return ok({ channel: data }, 201);
}
