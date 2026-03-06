import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { env } from '@/lib/env';
import type { User } from '@supabase/supabase-js';
import { getServiceAccess } from '@/lib/billingAccess';

type AuthFailure = {
  ok: false;
  error: string;
  status: number;
};

type RequireUserSuccess = {
  ok: true;
  user: User;
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
};

type RequireTenantSuccess = RequireUserSuccess & { clientId: string };
type RequireKumeraMessagingAdminSuccess = RequireUserSuccess & {
  serviceSupabase: ReturnType<typeof createSupabaseServiceClient>;
};

function shouldEnforceBillingSubscription() {
  return (
    process.env.KUMERA_MESSAGING_ENFORCE_BILLING_SUBSCRIPTION ??
    process.env.LEADOS_ENFORCE_BILLING_SUBSCRIPTION
  ) === 'true';
}

function getBillingServiceKey() {
  return process.env.KUMERA_MESSAGING_BILLING_SERVICE_KEY ?? 'leados';
}

export async function requireUser(): Promise<AuthFailure | RequireUserSuccess> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return { ok: false, error: 'Unauthorized', status: 401 };
  }

  return { ok: true, user: data.user, supabase };
}

export async function requireTenantClientId(): Promise<AuthFailure | RequireTenantSuccess> {
  const auth = await requireUser();
  if (!auth.ok) {
    return auth;
  }

  const { data, error } = await auth.supabase
    .from('user_clients')
    .select('client_id')
    .eq('user_id', auth.user.id)
    .limit(1)
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message, status: 403 };
  }

  if (!data?.client_id) {
    return { ok: false, error: 'Tenant relation not found', status: 403 };
  }

  if (shouldEnforceBillingSubscription()) {
    const access = await getServiceAccess({
      serviceKey: getBillingServiceKey(),
      serviceSubjectId: data.client_id as string
    });
    if (!access.allowed) {
      return { ok: false, error: 'Subscription inactive', status: 403 };
    }
  }

  return { ok: true, user: auth.user, supabase: auth.supabase, clientId: data.client_id as string };
}

export async function requireKumeraMessagingAdmin(): Promise<AuthFailure | RequireKumeraMessagingAdminSuccess> {
  const auth = await requireUser();
  if (!auth.ok) {
    return auth;
  }

  const expected = env.kumeraMessagingAdminEmail?.toLowerCase();
  const current = auth.user.email?.toLowerCase();

  if (!expected || !current || expected !== current) {
    return { ok: false, error: 'Forbidden', status: 403 };
  }

  return {
    ok: true,
    user: auth.user,
    supabase: auth.supabase,
    serviceSupabase: createSupabaseServiceClient()
  };
}

export async function requireBackofficeAdmin() {
  return requireKumeraMessagingAdmin();
}
