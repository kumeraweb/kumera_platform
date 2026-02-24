-- Paso 02
-- Tuejecutiva schema + RLS

-- TuEjecutiva.cl
-- Espejo del schema actual auditado (2026-02-21, actualizado post-hardening)

create extension if not exists "pgcrypto";
create schema if not exists tuejecutiva;

-- 1) Tables
create table if not exists tuejecutiva.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  icon text,
  created_at timestamptz not null default now()
);

create table if not exists tuejecutiva.regions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists tuejecutiva.executives (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  phone text not null,
  company text not null,
  specialty text,
  description text,
  whatsapp_message text,
  photo_url text,
  company_logo_url text,
  faq jsonb,
  coverage_all boolean not null default false,
  verified boolean not null default false,
  verified_date date,
  status text not null default 'pending' check (status in ('draft','pending','active','inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  experience_years integer,
  plan text default 'bronce' check (plan in ('bronce','plata','oro')),
  company_website_url text,
  constraint executives_company_website_url_check
    check (company_website_url is null or company_website_url ~* '^https?://')
);

create table if not exists tuejecutiva.executive_categories (
  executive_id uuid not null references tuejecutiva.executives(id) on delete cascade,
  category_id uuid not null references tuejecutiva.categories(id) on delete cascade,
  primary key (executive_id, category_id)
);

create table if not exists tuejecutiva.executive_regions (
  executive_id uuid not null references tuejecutiva.executives(id) on delete cascade,
  region_id uuid not null references tuejecutiva.regions(id) on delete cascade,
  primary key (executive_id, region_id)
);

create table if not exists tuejecutiva.executive_plans (
  id uuid primary key default gen_random_uuid(),
  executive_id uuid not null references tuejecutiva.executives(id) on delete cascade,
  name text not null,
  price_from text,
  target text,
  description text,
  features jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists tuejecutiva.onboarding_tokens (
  id uuid primary key default gen_random_uuid(),
  email text,
  token text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists tuejecutiva.onboarding_submissions (
  id uuid primary key default gen_random_uuid(),
  token_id uuid not null references tuejecutiva.onboarding_tokens(id) on delete restrict,
  full_name text not null,
  email text not null,
  phone text not null,
  company text not null,
  experience_years integer,
  specialty text,
  description text,
  whatsapp_message text,
  photo_url text,
  company_logo_url text,
  faq jsonb,
  coverage_all boolean not null default false,
  accepted_terms boolean not null,
  accepted_data_use boolean not null,
  status text not null default 'pending' check (status in ('pending','reviewed','approved','rejected')),
  created_at timestamptz not null default now(),
  custom_category text
);

create table if not exists tuejecutiva.onboarding_submission_categories (
  submission_id uuid not null references tuejecutiva.onboarding_submissions(id) on delete cascade,
  category_id uuid not null references tuejecutiva.categories(id) on delete restrict,
  primary key (submission_id, category_id)
);

create table if not exists tuejecutiva.onboarding_submission_regions (
  submission_id uuid not null references tuejecutiva.onboarding_submissions(id) on delete cascade,
  region_id uuid not null references tuejecutiva.regions(id) on delete restrict,
  primary key (submission_id, region_id)
);

create table if not exists tuejecutiva.onboarding_submission_files (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references tuejecutiva.onboarding_submissions(id) on delete cascade,
  file_type text not null check (file_type in ('contract','identity','other')),
  file_path text not null,
  file_name text not null,
  mime_type text not null,
  created_at timestamptz not null default now()
);

create table if not exists tuejecutiva.onboarding_submission_photos (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references tuejecutiva.onboarding_submissions(id) on delete cascade,
  photo_path text not null,
  mime_type text not null,
  created_at timestamptz not null default now()
);

create table if not exists tuejecutiva.admins (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

-- 2) Indexes
create index if not exists executive_categories_category_id_idx on tuejecutiva.executive_categories(category_id);
create index if not exists executive_regions_region_id_idx on tuejecutiva.executive_regions(region_id);
create index if not exists executives_status_idx on tuejecutiva.executives(status);
create index if not exists executives_coverage_all_idx on tuejecutiva.executives(coverage_all);
create index if not exists onboarding_tokens_token_idx on tuejecutiva.onboarding_tokens(token);
create index if not exists onboarding_submissions_status_idx on tuejecutiva.onboarding_submissions(status);
create index if not exists onboarding_submissions_created_at_idx on tuejecutiva.onboarding_submissions(created_at desc);
create index if not exists onboarding_tokens_expires_at_idx on tuejecutiva.onboarding_tokens(expires_at);
create index if not exists onboarding_submission_photos_submission_idx on tuejecutiva.onboarding_submission_photos(submission_id);

-- 3) Trigger function + trigger
create or replace function tuejecutiva.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists executives_set_updated_at on tuejecutiva.executives;
create trigger executives_set_updated_at
before update on tuejecutiva.executives
for each row execute function tuejecutiva.set_updated_at();

drop trigger if exists executive_plans_set_updated_at on tuejecutiva.executive_plans;
create trigger executive_plans_set_updated_at
before update on tuejecutiva.executive_plans
for each row execute function tuejecutiva.set_updated_at();

-- 4) RLS status (actual)
alter table tuejecutiva.admins enable row level security;
alter table tuejecutiva.categories enable row level security;
alter table tuejecutiva.executive_categories enable row level security;
alter table tuejecutiva.executive_regions enable row level security;
alter table tuejecutiva.executives enable row level security;
alter table tuejecutiva.onboarding_submission_categories enable row level security;
alter table tuejecutiva.onboarding_submission_files enable row level security;
alter table tuejecutiva.onboarding_submission_photos enable row level security;
alter table tuejecutiva.onboarding_submission_regions enable row level security;
alter table tuejecutiva.onboarding_submissions enable row level security;
alter table tuejecutiva.onboarding_tokens enable row level security;
alter table tuejecutiva.regions enable row level security;
alter table tuejecutiva.executive_plans enable row level security;

-- 5) Policies (actuales)
drop policy if exists "public_read_categories" on tuejecutiva.categories;
create policy "public_read_categories"
on tuejecutiva.categories
for select
to anon
using (true);

drop policy if exists "public_read_regions" on tuejecutiva.regions;
create policy "public_read_regions"
on tuejecutiva.regions
for select
to anon
using (true);

drop policy if exists "public_read_executive_categories" on tuejecutiva.executive_categories;
create policy "public_read_executive_categories"
on tuejecutiva.executive_categories
for select
to anon
using (true);

drop policy if exists "public_read_executive_regions" on tuejecutiva.executive_regions;
create policy "public_read_executive_regions"
on tuejecutiva.executive_regions
for select
to anon
using (true);

drop policy if exists "public_read_executives_active" on tuejecutiva.executives;
create policy "public_read_executives_active"
on tuejecutiva.executives
for select
to anon
using (status = 'active');

drop policy if exists "public_read_executive_plans_active_exec" on tuejecutiva.executive_plans;
create policy "public_read_executive_plans_active_exec"
on tuejecutiva.executive_plans
for select
to anon
using (
  active = true
  and exists (
    select 1
    from tuejecutiva.executives e
    where e.id = executive_plans.executive_id
      and e.status = 'active'
  )
);

drop policy if exists "Admins can read themselves" on tuejecutiva.admins;
create policy "Admins can read themselves"
on tuejecutiva.admins
for select
to public
using (auth.uid() = id);

drop policy if exists "No inserts from app" on tuejecutiva.admins;
create policy "No inserts from app"
on tuejecutiva.admins
for insert
to public
with check (false);
