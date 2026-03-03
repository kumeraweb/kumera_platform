create extension if not exists "pgcrypto";

create type service_status as enum (
  'pending_activation',
  'active',
  'suspended',
  'cancelled'
);

create type payment_status as enum (
  'pending',
  'validated',
  'rejected',
  'expired'
);

create type tax_document_type as enum ('boleta', 'factura');
create type payment_method as enum ('bank_transfer');
create type role_type as enum ('admin');

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  rut text not null,
  address text not null,
  email text not null,
  phone text not null,
  tax_document_type tax_document_type not null,
  created_at timestamptz not null default now()
);

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references services(id) on delete cascade,
  name text not null,
  price_cents integer not null check (price_cents >= 0),
  billing_cycle_days integer not null default 30,
  created_at timestamptz not null default now()
);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  service_id uuid not null references services(id) on delete restrict,
  plan_id uuid not null references plans(id) on delete restrict,
  status service_status not null default 'pending_activation',
  created_at timestamptz not null default now(),
  unique (company_id, service_id)
);

create table if not exists contracts (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references subscriptions(id) on delete cascade,
  version text not null,
  pdf_path text,
  accepted boolean not null default false,
  accepted_at timestamptz,
  accepted_ip text,
  accepted_user_agent text,
  created_at timestamptz not null default now()
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references subscriptions(id) on delete cascade,
  method payment_method not null default 'bank_transfer',
  status payment_status not null default 'pending',
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

create table if not exists payment_transfer_proofs (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references payments(id) on delete cascade,
  file_path text not null,
  mime_type text not null,
  size_bytes integer not null,
  created_at timestamptz not null default now()
);

create table if not exists admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role role_type not null default 'admin',
  email text,
  created_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  actor text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists notification_logs (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid references payments(id) on delete set null,
  channel text not null,
  category text not null,
  dedupe_key text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists onboarding_tokens (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references subscriptions(id) on delete cascade,
  token text unique not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

alter table companies enable row level security;
alter table services enable row level security;
alter table plans enable row level security;
alter table subscriptions enable row level security;
alter table contracts enable row level security;
alter table payments enable row level security;
alter table payment_transfer_proofs enable row level security;
alter table admin_profiles enable row level security;
alter table audit_logs enable row level security;
alter table notification_logs enable row level security;
alter table onboarding_tokens enable row level security;

create policy "admin can read companies" on companies for select
using (
  exists (
    select 1 from admin_profiles
    where admin_profiles.user_id = auth.uid()
      and admin_profiles.role = 'admin'
  )
);

create policy "admin can read services" on services for select
using (
  exists (
    select 1 from admin_profiles
    where admin_profiles.user_id = auth.uid()
      and admin_profiles.role = 'admin'
  )
);

create policy "admin can read plans" on plans for select
using (
  exists (
    select 1 from admin_profiles
    where admin_profiles.user_id = auth.uid()
      and admin_profiles.role = 'admin'
  )
);

create policy "admin can read subscriptions" on subscriptions for select
using (
  exists (
    select 1 from admin_profiles
    where admin_profiles.user_id = auth.uid()
      and admin_profiles.role = 'admin'
  )
);

create policy "admin can update subscriptions" on subscriptions for update
using (
  exists (
    select 1 from admin_profiles
    where admin_profiles.user_id = auth.uid()
      and admin_profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1 from admin_profiles
    where admin_profiles.user_id = auth.uid()
      and admin_profiles.role = 'admin'
  )
);

create policy "admin can read contracts" on contracts for select
using (
  exists (
    select 1 from admin_profiles
    where admin_profiles.user_id = auth.uid()
      and admin_profiles.role = 'admin'
  )
);

create policy "admin can read payments" on payments for select
using (
  exists (
    select 1 from admin_profiles
    where admin_profiles.user_id = auth.uid()
      and admin_profiles.role = 'admin'
  )
);

create policy "admin can update payments" on payments for update
using (
  exists (
    select 1 from admin_profiles
    where admin_profiles.user_id = auth.uid()
      and admin_profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1 from admin_profiles
    where admin_profiles.user_id = auth.uid()
      and admin_profiles.role = 'admin'
  )
);

create policy "admin can read proofs" on payment_transfer_proofs for select
using (
  exists (
    select 1 from admin_profiles
    where admin_profiles.user_id = auth.uid()
      and admin_profiles.role = 'admin'
  )
);

create policy "admin can read profile" on admin_profiles for select
using (auth.uid() = user_id);

create policy "admin can read logs" on audit_logs for select
using (
  exists (
    select 1 from admin_profiles
    where admin_profiles.user_id = auth.uid()
      and admin_profiles.role = 'admin'
  )
);

create policy "admin can read notifications" on notification_logs for select
using (
  exists (
    select 1 from admin_profiles
    where admin_profiles.user_id = auth.uid()
      and admin_profiles.role = 'admin'
  )
);

create policy "admin can read onboarding tokens" on onboarding_tokens for select
using (
  exists (
    select 1 from admin_profiles
    where admin_profiles.user_id = auth.uid()
      and admin_profiles.role = 'admin'
  )
);
