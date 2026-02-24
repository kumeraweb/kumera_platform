import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { fail, ok } from "@/lib/http";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return fail(401, "UNAUTHORIZED", "Admin session is required");
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("companies")
    .select("id,legal_name,rut,email,phone,created_at,subscriptions(id,status,services(name),plans(name,price_cents))")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return fail(500, "DB_ERROR", "Failed to fetch clients", error.message);
  }

  return ok(data ?? []);
}
