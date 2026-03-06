'use client';

import { createKumeraMessagingBrowserClient } from '@/lib/db';

export function createSupabaseBrowserClient() {
  return createKumeraMessagingBrowserClient();
}
