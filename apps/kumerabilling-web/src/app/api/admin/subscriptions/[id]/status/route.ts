import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { fail, ok } from "@/lib/http";
import { writeAuditLog } from "@/lib/onboarding";
import { updateSubscriptionStatusSchema } from "@/lib/validation";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return fail(401, "UNAUTHORIZED", "Admin session is required");
  }

  const payload = updateSubscriptionStatusSchema.safeParse(await request.json());
  if (!payload.success) {
    return fail(400, "VALIDATION_ERROR", "Invalid status payload", payload.error.flatten());
  }

  const { id } = await context.params;
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("subscriptions")
    .update({ status: payload.data.status })
    .eq("id", id);

  if (error) {
    return fail(500, "DB_ERROR", "Failed to update subscription status", error.message);
  }

  await writeAuditLog("subscription.status.updated", auth.userId, {
    subscriptionId: id,
    status: payload.data.status,
  });

  return ok({ updated: true });
}
