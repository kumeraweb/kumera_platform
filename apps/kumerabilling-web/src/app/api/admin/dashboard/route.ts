import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { fail, ok } from "@/lib/http";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return fail(401, "UNAUTHORIZED", "Admin session is required");
  }

  const supabase = createAdminClient();

  const [pendingPayments, overduePayments, activeSubscriptions] = await Promise.all([
    supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("payments").select("id", { count: "exact", head: true }).eq("is_overdue", true),
    supabase
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
  ]);

  if (pendingPayments.error || overduePayments.error || activeSubscriptions.error) {
    return fail(500, "DB_ERROR", "Failed to fetch dashboard data");
  }

  return ok({
    pendingPayments: pendingPayments.count ?? 0,
    overduePayments: overduePayments.count ?? 0,
    activeSubscriptions: activeSubscriptions.count ?? 0,
  });
}
