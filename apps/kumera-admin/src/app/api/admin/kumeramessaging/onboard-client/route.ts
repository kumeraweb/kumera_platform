import { z } from "zod";
import { requireAdminApi, ROLE } from "@/lib/auth";
import { createLeadosServiceClient } from "@/lib/db";
import { encryptLeadosSecret } from "@/lib/crypto";
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

const onboardClientSchema = z.object({
  name: z.string().min(1),
  notification_email: z.string().email(),
  human_forward_number: z.string().min(1),
  priority_contact_email: optionalEmail,
  human_required_message_template: optionalTemplate,
  close_client_no_response_template: optionalTemplate,
  close_attended_other_line_template: optionalTemplate,
  score_threshold: z.number().int().min(0).max(100),
  strategic_questions: z.array(z.string()).max(3).default([]),
  phone_number_id: z.string().min(1),
  waba_id: z.string().optional().nullable(),
  meta_access_token: z.string().min(1),
  meta_app_secret: z.string().min(1),
  assign_to_current_user: z.boolean().default(true),
});

export async function POST(req: Request) {
  const auth = await requireAdminApi([ROLE.KUMERA_MESSAGING, ROLE.LEADOS]);
  if (!auth.ok) return auth.response;

  const payload = await req.json().catch(() => null);
  const parsed = onboardClientSchema.safeParse(payload);
  if (!parsed.success) return fail("Invalid payload", 400);

  const body = parsed.data;
  const leados = createLeadosServiceClient();

  const { data: client, error: clientError } = await leados
    .from("clients")
    .insert({
      name: body.name,
      notification_email: body.notification_email,
      human_forward_number: body.human_forward_number,
      priority_contact_email: body.priority_contact_email,
      human_required_message_template: body.human_required_message_template,
      close_client_no_response_template: body.close_client_no_response_template,
      close_attended_other_line_template: body.close_attended_other_line_template,
      score_threshold: body.score_threshold,
      strategic_questions: body.strategic_questions,
    })
    .select("*")
    .single();

  if (clientError || !client) {
    return fail(clientError?.message ?? "Could not create client", 500);
  }

  try {
    const { data: channel, error: channelError } = await leados
      .from("client_channels")
      .insert({
        client_id: client.id,
        phone_number_id: body.phone_number_id,
        waba_id: body.waba_id ?? null,
        is_active: true,
        meta_access_token_enc: encryptLeadosSecret(body.meta_access_token),
        meta_app_secret_enc: encryptLeadosSecret(body.meta_app_secret),
        encryption_version: 1,
      })
      .select("*")
      .single();

    if (channelError || !channel) {
      throw new Error(channelError?.message ?? "Could not create channel");
    }

    let userClient: { user_id: string; client_id: string } | null = null;

    if (body.assign_to_current_user) {
      const { data, error } = await leados
        .from("user_clients")
        .upsert(
          { user_id: auth.user.id, client_id: client.id },
          { onConflict: "user_id,client_id" }
        )
        .select("user_id, client_id")
        .single();

      if (error || !data) {
        throw new Error(error?.message ?? "Could not assign current user");
      }

      userClient = data;
    }

    return ok({ client, channel, user_client: userClient }, 201);
  } catch (error) {
    await leados.from("clients").delete().eq("id", client.id);
    return fail(error instanceof Error ? error.message : "Could not onboard client", 500);
  }
}
