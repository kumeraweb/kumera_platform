create table if not exists billing.payment_access_tokens (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references billing.subscriptions(id) on delete cascade,
  payment_id uuid not null references billing.payments(id) on delete cascade,
  token text not null unique,
  expires_at timestamptz not null,
  consumed_at timestamptz null,
  revoked_at timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists idx_billing_payment_access_tokens_subscription
  on billing.payment_access_tokens(subscription_id, created_at desc);

create index if not exists idx_billing_payment_access_tokens_payment
  on billing.payment_access_tokens(payment_id, created_at desc);

alter table billing.payment_access_tokens enable row level security;

drop policy if exists billing_admin_can_read_payment_access_tokens on billing.payment_access_tokens;
create policy billing_admin_can_read_payment_access_tokens on billing.payment_access_tokens for select
using (
  exists (
    select 1 from billing.admin_profiles
    where billing.admin_profiles.user_id = auth.uid()
      and billing.admin_profiles.role = 'admin'
  )
);

drop policy if exists billing_admin_can_write_payment_access_tokens on billing.payment_access_tokens;
create policy billing_admin_can_write_payment_access_tokens on billing.payment_access_tokens for all
using (
  exists (
    select 1 from billing.admin_profiles
    where billing.admin_profiles.user_id = auth.uid()
      and billing.admin_profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1 from billing.admin_profiles
    where billing.admin_profiles.user_id = auth.uid()
      and billing.admin_profiles.role = 'admin'
  )
);
