import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCronSecret } from "@/lib/env";
import { calculateNextPaymentDate } from "@/lib/domain/billing";
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
  const { data: validatedToday, error } = await supabase
    .from("payments")
    .select("id,subscription_id,amount_cents,validated_at")
    .eq("status", "validated")
    .gte("validated_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  if (error) {
    return fail(500, "DB_ERROR", "Failed to fetch validated payments", error.message);
  }

  let created = 0;

  for (const payment of validatedToday ?? []) {
    if (!payment.validated_at) {
      continue;
    }

    const dueDate = calculateNextPaymentDate(new Date(payment.validated_at));
    const dedupeKey = `next:${payment.id}:${dueDate.toISOString().slice(0, 10)}`;

    const { data: existing } = await supabase
      .from("notification_logs")
      .select("id")
      .eq("dedupe_key", dedupeKey)
      .maybeSingle();

    if (existing) {
      continue;
    }

    await supabase.from("payments").insert({
      subscription_id: payment.subscription_id,
      method: "bank_transfer",
      status: "pending",
      amount_cents: payment.amount_cents,
      due_date: dueDate.toISOString(),
    });

    await supabase.from("notification_logs").insert({
      payment_id: payment.id,
      channel: "system",
      category: "next_payment_generated",
      dedupe_key: dedupeKey,
    });

    created += 1;
  }

  return ok({ created });
}
