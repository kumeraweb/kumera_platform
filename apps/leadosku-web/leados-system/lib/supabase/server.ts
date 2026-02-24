import { createLeadosServerClient } from '@/lib/db.server';

export async function createSupabaseServerClient() {
  return createLeadosServerClient();
}
