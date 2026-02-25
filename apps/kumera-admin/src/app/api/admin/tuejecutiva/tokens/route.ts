import { z } from "zod";
import { requireAdminApi, ROLE } from "@/lib/auth";
import { createTuejecutivaServiceClient } from "@/lib/db";
import { fail, ok } from "@/lib/http";

const createTokenSchema = z.object({
  email: z.string().email().optional().or(z.literal("")),
  expires_in_days: z.number().int().min(1).max(30).default(7),
});

export async function POST(req: Request) {
  const auth = await requireAdminApi([ROLE.TUEJECUTIVA]);
  if (!auth.ok) return auth.response;

  const payload = await req.json().catch(() => null);
  const parsed = createTokenSchema.safeParse(payload);
  if (!parsed.success) return fail("Invalid payload", 400);

  const body = parsed.data;
  const tuejecutiva = createTuejecutivaServiceClient();
  const nowIso = new Date().toISOString();
  const email = typeof body.email === "string" && body.email.trim().length > 0 ? body.email.trim() : null;

  let existingQuery = tuejecutiva
    .from("onboarding_tokens")
    .select("id, email, token, expires_at, used_at")
    .is("used_at", null)
    .gt("expires_at", nowIso)
    .order("created_at", { ascending: false })
    .limit(1);

  if (email) {
    existingQuery = existingQuery.eq("email", email);
  } else {
    existingQuery = existingQuery.is("email", null);
  }

  const { data: existing, error: existingError } = await existingQuery.maybeSingle();
  if (existingError) return fail(existingError.message, 500);

  const siteUrl = process.env.NEXT_PUBLIC_TUEJECUTIVA_SITE_URL || "https://tuejecutiva.cl";

  if (existing) {
    return ok({
      token: {
        token: existing.token,
        email: existing.email,
        expires_at: existing.expires_at,
        link: `${siteUrl}/onboarding/${existing.token}`,
        reused: true,
      },
    });
  }

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + body.expires_in_days * 24 * 60 * 60 * 1000).toISOString();

  const { data: created, error: createError } = await tuejecutiva
    .from("onboarding_tokens")
    .insert({
      email,
      token,
      expires_at: expiresAt,
    })
    .select("token, email, expires_at")
    .single();

  if (createError || !created) return fail(createError?.message ?? "Could not create token", 500);

  return ok(
    {
      token: {
        token: created.token,
        email: created.email,
        expires_at: created.expires_at,
        link: `${siteUrl}/onboarding/${created.token}`,
        reused: false,
      },
    },
    201
  );
}
