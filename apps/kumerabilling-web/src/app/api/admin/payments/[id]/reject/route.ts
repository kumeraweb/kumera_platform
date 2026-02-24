import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { fail, ok } from "@/lib/http";
import { writeAuditLog } from "@/lib/onboarding";
import { paymentRejectSchema } from "@/lib/validation";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return fail(401, "UNAUTHORIZED", "Admin session is required");
  }

  const payload = paymentRejectSchema.safeParse(await request.json());
  if (!payload.success) {
    return fail(400, "VALIDATION_ERROR", "Invalid reject payload", payload.error.flatten());
  }

  const { id } = await context.params;
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("payments")
    .update({
      status: "rejected",
      rejection_reason: payload.data.reason,
      validated_at: null,
    })
    .eq("id", id);

  if (error) {
    return fail(500, "DB_ERROR", "Failed to reject payment", error.message);
  }

  await writeAuditLog("payment.rejected", auth.userId, {
    paymentId: id,
    reason: payload.data.reason,
  });

  return ok({ rejected: true });
}
