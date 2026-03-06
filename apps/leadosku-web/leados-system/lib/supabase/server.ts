import { createKumeraMessagingServerClient } from '@/lib/db.server';

export async function createSupabaseServerClient() {
  return createKumeraMessagingServerClient();
}
