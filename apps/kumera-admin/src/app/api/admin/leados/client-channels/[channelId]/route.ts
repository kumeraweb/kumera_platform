import { z } from "zod";
import { requireAdminApi, ROLE } from "@/lib/auth";
import { createLeadosServiceClient } from "@/lib/db";
import { encryptLeadosSecret } from "@/lib/crypto";
import { fail, ok } from "@/lib/http";

const updateChannelSchema = z.object({
  phone_number_id: z.string().min(1).optional(),
  waba_id: z.string().nullable().optional(),
  meta_access_token: z.string().min(1).optional(),
  meta_app_secret: z.string().min(1).optional(),
  is_active: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ channelId: string }> },
) {
  const auth = await requireAdminApi([ROLE.KUMERA_MESSAGING, ROLE.LEADOS]);
  if (!auth.ok) return auth.response;

  const payload = await req.json().catch(() => null);
  const parsed = updateChannelSchema.safeParse(payload);
  if (!parsed.success) return fail("Invalid payload", 400);

  const { channelId } = await params;
  const body = parsed.data;

  const updateData: Record<string, unknown> = {};
  if (body.phone_number_id !== undefined) updateData.phone_number_id = body.phone_number_id;
  if (body.waba_id !== undefined) updateData.waba_id = body.waba_id;
  if (body.is_active !== undefined) updateData.is_active = body.is_active;
  if (body.meta_access_token) updateData.meta_access_token_enc = encryptLeadosSecret(body.meta_access_token);
  if (body.meta_app_secret) updateData.meta_app_secret_enc = encryptLeadosSecret(body.meta_app_secret);

  if (Object.keys(updateData).length === 0) {
    return fail("No changes submitted", 400);
  }

  const leados = createLeadosServiceClient();
  const { data, error } = await leados
    .from("client_channels")
    .update(updateData)
    .eq("id", channelId)
    .select("*")
    .maybeSingle();

  if (error) return fail(error.message, 500);
  if (!data) return fail("Channel not found", 404);

  return ok({ channel: data });
}
