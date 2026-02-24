import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCronSecret } from "@/lib/env";
import { hasReachedGraceLimit, isOverdue } from "@/lib/domain/billing";
import { fail, ok } from "@/lib/http";

function isAuthorized(request: NextRequest) {
  const header = request.headers.get("authorization");
  if (!header) return false;
  return header === `Bearer ${getCronSecret()}`;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return fail(401, "UNAUTHORIZED", "Invalid CRON secret");
  }

  const supabase = createAdminClient();

  const { data: pending, error } = await supabase
    .from("payments")
    .select("id,due_date")
    .eq("status", "pending");

  if (error) {
    return fail(500, "DB_ERROR", "Failed to fetch pending payments", error.message);
  }

  const now = new Date();
  let expiredCount = 0;
  let reachedGraceCount = 0;

  for (const payment of pending ?? []) {
    const dueDate = new Date(payment.due_date);
    if (isOverdue(now, dueDate)) {
      expiredCount += 1;
      await supabase
        .from("payments")
        .update({ status: "expired", is_overdue: true, overdue_since: dueDate.toISOString() })
        .eq("id", payment.id)
        .eq("status", "pending");

      if (hasReachedGraceLimit(now, dueDate, 7)) {
        reachedGraceCount += 1;
      }
    }
  }

  return ok({ expiredCount, reachedGraceCount });
}
