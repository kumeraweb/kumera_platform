-- Kumera Platform v2
-- Non-destructive baseline for unified Supabase with modular schemas.

create schema if not exists core;
create schema if not exists billing;
create schema if not exists tuejecutiva;
create schema if not exists leados;

-- =========================
-- CORE
-- =========================
do $$ begin
  create type core.global_role as enum ('superadmin', 'admin_billing', 'admin_tuejecutiva', 'admin_leados');
exception
  when duplicate_object then null;
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

-- Only superadmin can view roles from client JWT context.
drop policy if exists "core_roles_select_superadmin" on core.user_roles;
create policy "core_roles_select_superadmin"
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

-- Block direct writes from anon/authenticated; backend uses service role.
drop policy if exists "core_roles_no_direct_write" on core.user_roles;
create policy "core_roles_no_direct_write"
on core.user_roles
for all
to authenticated
using (false)
with check (false);

drop policy if exists "core_audit_select_superadmin" on core.audit_logs;
create policy "core_audit_select_superadmin"
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

drop policy if exists "core_audit_no_direct_write" on core.audit_logs;
create policy "core_audit_no_direct_write"
on core.audit_logs
for all
to authenticated
using (false)
with check (false);

-- =========================
-- BILLING
-- =========================
do $$ begin
  create type billing.subscription_status as enum ('trial', 'active', 'past_due', 'canceled', 'paused', 'inactive');
exception
  when duplicate_object then null;
end $$;

create table if not exists billing.subscriptions (
  id uuid primary key default gen_random_uuid(),
  service_key text not null,
  service_subject_id text not null,
  status billing.subscription_status not null default 'trial',
  plan_code text not null,
  period_start timestamptz null,
  period_end timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_billing_subscriptions_service
  on billing.subscriptions(service_key, service_subject_id, created_at desc);

create table if not exists billing.payments (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references billing.subscriptions(id) on delete cascade,
  amount_clp bigint not null,
  status text not null,
  due_at timestamptz null,
  paid_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table billing.subscriptions enable row level security;
alter table billing.payments enable row level security;

drop policy if exists "billing_subscriptions_select_admin" on billing.subscriptions;
create policy "billing_subscriptions_select_admin"
on billing.subscriptions
for select
to authenticated
using (
  exists (
    select 1
    from core.user_roles ur
    where ur.user_id = auth.uid()
      and ur.active = true
      and ur.role in ('superadmin', 'admin_billing')
  )
);

drop policy if exists "billing_subscriptions_no_direct_write" on billing.subscriptions;
create policy "billing_subscriptions_no_direct_write"
on billing.subscriptions
for all
to authenticated
using (false)
with check (false);

drop policy if exists "billing_payments_select_admin" on billing.payments;
create policy "billing_payments_select_admin"
on billing.payments
for select
to authenticated
using (
  exists (
    select 1
    from core.user_roles ur
    where ur.user_id = auth.uid()
      and ur.active = true
      and ur.role in ('superadmin', 'admin_billing')
  )
);

drop policy if exists "billing_payments_no_direct_write" on billing.payments;
create policy "billing_payments_no_direct_write"
on billing.payments
for all
to authenticated
using (false)
with check (false);

-- =========================
-- Service schemas (placeholder tables for staged migration)
-- =========================
create table if not exists tuejecutiva.service_tenants (
  id uuid primary key default gen_random_uuid(),
  external_key text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists leados.service_tenants (
  id uuid primary key default gen_random_uuid(),
  external_key text not null unique,
  created_at timestamptz not null default now()
);

alter table tuejecutiva.service_tenants enable row level security;
alter table leados.service_tenants enable row level security;

drop policy if exists "tuejecutiva_tenants_no_direct_access" on tuejecutiva.service_tenants;
create policy "tuejecutiva_tenants_no_direct_access"
on tuejecutiva.service_tenants
for all
to authenticated
using (false)
with check (false);

drop policy if exists "leados_tenants_no_direct_access" on leados.service_tenants;
create policy "leados_tenants_no_direct_access"
on leados.service_tenants
for all
to authenticated
using (false)
with check (false);
