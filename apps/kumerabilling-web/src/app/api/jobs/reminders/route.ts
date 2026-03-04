import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCronSecret } from "@/lib/env";
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
  const today = new Date();

  const { data: dueSoon, error } = await supabase
    .from("payments")
    .select("id,due_date,subscription_id")
    .eq("status", "pending")
    .lte("due_date", new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString());

  if (error) {
    return fail(500, "DB_ERROR", "Failed to fetch due payments", error.message);
  }

  const notifications = (dueSoon ?? []).map((row) => ({
    payment_id: row.id,
    channel: "email",
    category: "reminder",
    dedupe_key: `reminder:${row.id}:${today.toISOString().slice(0, 10)}`,
  }));

  if (notifications.length > 0) {
    const { error: insertError } = await supabase
      .from("notification_logs")
      .upsert(notifications, { onConflict: "dedupe_key", ignoreDuplicates: true });

    if (insertError) {
      return fail(500, "DB_ERROR", "Failed to write notification logs", insertError.message);
    }
  }

  return ok({ remindersQueued: notifications.length });
}
