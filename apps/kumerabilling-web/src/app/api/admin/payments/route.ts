import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { fail, ok } from "@/lib/http";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return fail(401, "UNAUTHORIZED", "Admin session is required");
  }

  const status = request.nextUrl.searchParams.get("status");
  const supabase = createAdminClient();

  let query = supabase
    .from("payments")
    .select("id,status,amount_cents,due_date,validated_at,rejection_reason,subscription_id,subscriptions(companies(legal_name),services(name),plans(name))")
    .order("due_date", { ascending: true })
    .limit(200);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    return fail(500, "DB_ERROR", "Failed to fetch payments", error.message);
  }

  return ok(data ?? []);
}
