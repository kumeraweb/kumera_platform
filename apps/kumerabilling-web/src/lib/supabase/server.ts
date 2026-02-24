import { createBillingServerClient } from "@/lib/db.server";

export async function createServerSupabaseClient() {
  return createBillingServerClient();
}
