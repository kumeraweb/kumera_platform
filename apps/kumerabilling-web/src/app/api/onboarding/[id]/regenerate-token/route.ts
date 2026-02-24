import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { fail, ok } from "@/lib/http";
import { writeAuditLog } from "@/lib/onboarding";

export async function POST(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return fail(401, "UNAUTHORIZED", "Admin session is required");
  }

  const { id } = await context.params;
  const supabase = createAdminClient();

  await supabase
    .from("onboarding_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("subscription_id", id)
    .is("consumed_at", null)
    .is("revoked_at", null);

  const token = randomUUID() + randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase.from("onboarding_tokens").insert({
    subscription_id: id,
    token,
    expires_at: expiresAt,
  });

  if (error) {
    return fail(500, "DB_ERROR", "Failed to regenerate token", error.message);
  }

  await writeAuditLog("onboarding.token.regenerated", auth.userId, { subscriptionId: id });

  return ok({
    onboardingToken: token,
    onboardingUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/onboarding/${token}`,
    expiresAt,
  });
}
