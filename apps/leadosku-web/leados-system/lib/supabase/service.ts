import { createKumeraMessagingServiceClient } from '@/lib/db';

export function createSupabaseServiceClient() {
  return createKumeraMessagingServiceClient();
}
