-- Billing contract templates + rendered HTML contracts (additive migration)

create extension if not exists pgcrypto;

-- 1) Templates catalog per service
create table if not exists billing.contract_templates (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references billing.services(id) on delete cascade,
  name text not null,
  version text not null,
  status text not null default 'active' check (status in ('draft', 'active', 'archived')),
  html_template text not null,
  variables_schema jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (service_id, name, version)
);

create index if not exists idx_billing_contract_templates_service
  on billing.contract_templates(service_id, status, created_at desc);

-- 2) Extend existing contracts table to store immutable rendered HTML evidence
alter table billing.contracts
  add column if not exists template_id uuid references billing.contract_templates(id) on delete set null,
  add column if not exists template_version text,
  add column if not exists html_rendered text,
  add column if not exists content_hash text,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create index if not exists idx_billing_contracts_subscription_created
  on billing.contracts(subscription_id, created_at desc);

create index if not exists idx_billing_contracts_template
  on billing.contracts(template_id);

-- 3) Onboarding timeline events
create table if not exists billing.onboarding_events (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references billing.subscriptions(id) on delete cascade,
  token_id uuid references billing.onboarding_tokens(id) on delete set null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_billing_onboarding_events_subscription
  on billing.onboarding_events(subscription_id, created_at desc);

create index if not exists idx_billing_onboarding_events_type
  on billing.onboarding_events(event_type, created_at desc);

-- 4) Trigger for updated_at on templates
create or replace function billing.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_billing_contract_templates_updated_at on billing.contract_templates;
create trigger trg_billing_contract_templates_updated_at
before update on billing.contract_templates
for each row execute function billing.set_updated_at();

-- 5) RLS enable + policies (same model as existing billing admin policies)
alter table billing.contract_templates enable row level security;
alter table billing.onboarding_events enable row level security;

drop policy if exists billing_admin_can_read_contract_templates on billing.contract_templates;
create policy billing_admin_can_read_contract_templates on billing.contract_templates for select
using (
  exists (
    select 1 from billing.admin_profiles
    where billing.admin_profiles.user_id = auth.uid()
      and billing.admin_profiles.role = 'admin'
  )
);

drop policy if exists billing_admin_can_write_contract_templates on billing.contract_templates;
create policy billing_admin_can_write_contract_templates on billing.contract_templates for all
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

drop policy if exists billing_admin_can_read_onboarding_events on billing.onboarding_events;
create policy billing_admin_can_read_onboarding_events on billing.onboarding_events for select
using (
  exists (
    select 1 from billing.admin_profiles
    where billing.admin_profiles.user_id = auth.uid()
      and billing.admin_profiles.role = 'admin'
  )
);

drop policy if exists billing_admin_can_write_onboarding_events on billing.onboarding_events;
create policy billing_admin_can_write_onboarding_events on billing.onboarding_events for all
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

-- 6) Storage buckets (idempotent)
insert into storage.buckets (id, name, public)
values ('contract-assets', 'contract-assets', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do nothing;
