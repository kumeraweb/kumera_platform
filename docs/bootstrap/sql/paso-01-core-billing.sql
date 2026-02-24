-- Paso 01
-- Core + Billing (base canónica de suscripciones)

create extension if not exists "pgcrypto";

create schema if not exists core;
create schema if not exists billing;

-- =========================
-- CORE
-- =========================
do $$ begin
  create type core.global_role as enum ('superadmin', 'admin_billing', 'admin_tuejecutiva', 'admin_leados');
exception when duplicate_object then null;
end $$;

create table if not exists core.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role core.global_role not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

create table if not exists core.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid null references auth.users(id) on delete set null,
  source_app text not null,
  action text not null,
  target_type text not null,
  target_id text null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table core.user_roles enable row level security;
alter table core.audit_logs enable row level security;

drop policy if exists core_roles_select_superadmin on core.user_roles;
create policy core_roles_select_superadmin
on core.user_roles
for select
to authenticated
using (
  exists (
    select 1
    from core.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'superadmin'
      and ur.active = true
  )
);

drop policy if exists core_roles_no_direct_write on core.user_roles;
create policy core_roles_no_direct_write
on core.user_roles
for all
to authenticated
using (false)
with check (false);

drop policy if exists core_audit_select_superadmin on core.audit_logs;
create policy core_audit_select_superadmin
on core.audit_logs
for select
to authenticated
using (
  exists (
    select 1
    from core.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'superadmin'
      and ur.active = true
  )
);

drop policy if exists core_audit_no_direct_write on core.audit_logs;
create policy core_audit_no_direct_write
on core.audit_logs
for all
to authenticated
using (false)
with check (false);

-- =========================
-- BILLING
-- =========================
do $$ begin
  create type billing.service_status as enum (
    'pending_activation',
    'active',
    'suspended',
    'cancelled'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type billing.payment_status as enum (
    'pending',
    'validated',
    'rejected',
    'expired'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type billing.tax_document_type as enum ('boleta', 'factura');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type billing.payment_method as enum ('bank_transfer');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type billing.role_type as enum ('admin');
exception when duplicate_object then null;
end $$;

create table if not exists billing.companies (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  rut text not null,
  address text not null,
  email text not null,
  phone text not null,
  tax_document_type billing.tax_document_type not null,
  created_at timestamptz not null default now()
);

create table if not exists billing.services (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists billing.plans (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references billing.services(id) on delete cascade,
  name text not null,
  price_cents integer not null check (price_cents >= 0),
  billing_cycle_days integer not null default 30,
  created_at timestamptz not null default now()
);

create table if not exists billing.subscriptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references billing.companies(id) on delete cascade,
  service_id uuid not null references billing.services(id) on delete restrict,
  plan_id uuid not null references billing.plans(id) on delete restrict,
  status billing.service_status not null default 'pending_activation',
  -- Canonical access keys for decoupled product checks.
  service_key text not null default 'legacy',
  service_subject_id text not null default 'default',
  period_start timestamptz,
  period_end timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (company_id, service_id)
);

create index if not exists idx_billing_subscriptions_service_subject
  on billing.subscriptions(service_key, service_subject_id, created_at desc);

create table if not exists billing.contracts (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references billing.subscriptions(id) on delete cascade,
  version text not null,
  pdf_path text,
  accepted boolean not null default false,
  accepted_at timestamptz,
  accepted_ip text,
  accepted_user_agent text,
  created_at timestamptz not null default now()
);

create table if not exists billing.payments (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references billing.subscriptions(id) on delete cascade,
  method billing.payment_method not null default 'bank_transfer',
  status billing.payment_status not null default 'pending',
  amount_cents integer not null check (amount_cents >= 0),
  due_date timestamptz not null,
  validated_at timestamptz,
  rejection_reason text,
  external_provider text,
  external_ref text,
  is_overdue boolean not null default false,
  overdue_since timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists billing.payment_transfer_proofs (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references billing.payments(id) on delete cascade,
  file_path text not null,
  mime_type text not null,
  size_bytes integer not null,
  created_at timestamptz not null default now()
);

create table if not exists billing.admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role billing.role_type not null default 'admin',
  email text,
  created_at timestamptz not null default now()
);

create table if not exists billing.audit_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  actor text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists billing.notification_logs (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid references billing.payments(id) on delete set null,
  channel text not null,
  category text not null,
  dedupe_key text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists billing.onboarding_tokens (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references billing.subscriptions(id) on delete cascade,
  token text unique not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

alter table billing.companies enable row level security;
alter table billing.services enable row level security;
alter table billing.plans enable row level security;
alter table billing.subscriptions enable row level security;
alter table billing.contracts enable row level security;
alter table billing.payments enable row level security;
alter table billing.payment_transfer_proofs enable row level security;
alter table billing.admin_profiles enable row level security;
alter table billing.audit_logs enable row level security;
alter table billing.notification_logs enable row level security;
alter table billing.onboarding_tokens enable row level security;

drop policy if exists billing_admin_can_read_companies on billing.companies;
create policy billing_admin_can_read_companies on billing.companies for select
using (
  exists (
    select 1 from billing.admin_profiles
    where billing.admin_profiles.user_id = auth.uid()
      and billing.admin_profiles.role = 'admin'
  )
);

drop policy if exists billing_admin_can_read_services on billing.services;
create policy billing_admin_can_read_services on billing.services for select
using (
  exists (
    select 1 from billing.admin_profiles
    where billing.admin_profiles.user_id = auth.uid()
      and billing.admin_profiles.role = 'admin'
  )
);

drop policy if exists billing_admin_can_read_plans on billing.plans;
create policy billing_admin_can_read_plans on billing.plans for select
using (
  exists (
    select 1 from billing.admin_profiles
    where billing.admin_profiles.user_id = auth.uid()
      and billing.admin_profiles.role = 'admin'
  )
);

drop policy if exists billing_admin_can_read_subscriptions on billing.subscriptions;
create policy billing_admin_can_read_subscriptions on billing.subscriptions for select
using (
  exists (
    select 1 from billing.admin_profiles
    where billing.admin_profiles.user_id = auth.uid()
      and billing.admin_profiles.role = 'admin'
  )
);

drop policy if exists billing_admin_can_update_subscriptions on billing.subscriptions;
create policy billing_admin_can_update_subscriptions on billing.subscriptions for update
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

drop policy if exists billing_admin_can_read_contracts on billing.contracts;
create policy billing_admin_can_read_contracts on billing.contracts for select
using (
  exists (
    select 1 from billing.admin_profiles
    where billing.admin_profiles.user_id = auth.uid()
      and billing.admin_profiles.role = 'admin'
  )
);

drop policy if exists billing_admin_can_read_payments on billing.payments;
create policy billing_admin_can_read_payments on billing.payments for select
using (
  exists (
    select 1 from billing.admin_profiles
    where billing.admin_profiles.user_id = auth.uid()
      and billing.admin_profiles.role = 'admin'
  )
);

drop policy if exists billing_admin_can_update_payments on billing.payments;
create policy billing_admin_can_update_payments on billing.payments for update
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

drop policy if exists billing_admin_can_read_proofs on billing.payment_transfer_proofs;
create policy billing_admin_can_read_proofs on billing.payment_transfer_proofs for select
using (
  exists (
    select 1 from billing.admin_profiles
    where billing.admin_profiles.user_id = auth.uid()
      and billing.admin_profiles.role = 'admin'
  )
);

drop policy if exists billing_admin_can_read_profile on billing.admin_profiles;
create policy billing_admin_can_read_profile on billing.admin_profiles for select
using (auth.uid() = user_id);

drop policy if exists billing_admin_can_read_logs on billing.audit_logs;
create policy billing_admin_can_read_logs on billing.audit_logs for select
using (
  exists (
    select 1 from billing.admin_profiles
    where billing.admin_profiles.user_id = auth.uid()
      and billing.admin_profiles.role = 'admin'
  )
);

drop policy if exists billing_admin_can_read_notifications on billing.notification_logs;
create policy billing_admin_can_read_notifications on billing.notification_logs for select
using (
  exists (
    select 1 from billing.admin_profiles
    where billing.admin_profiles.user_id = auth.uid()
      and billing.admin_profiles.role = 'admin'
  )
);

drop policy if exists billing_admin_can_read_onboarding_tokens on billing.onboarding_tokens;
create policy billing_admin_can_read_onboarding_tokens on billing.onboarding_tokens for select
using (
  exists (
    select 1 from billing.admin_profiles
    where billing.admin_profiles.user_id = auth.uid()
      and billing.admin_profiles.role = 'admin'
  )
);
