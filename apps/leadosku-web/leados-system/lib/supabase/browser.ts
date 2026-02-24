'use client';

import { createLeadosBrowserClient } from '@/lib/db';

export function createSupabaseBrowserClient() {
  return createLeadosBrowserClient();
}
