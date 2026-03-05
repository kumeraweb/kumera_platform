-- Paso 03
-- LeadOS schema + funciones + RLS + cron de encolado

create extension if not exists "pgcrypto";
create extension if not exists pg_cron;
create schema if not exists leados;

-- Enums
DO $$ BEGIN
  create type leados.conversation_status as enum ('ACTIVE', 'HUMAN_REQUIRED', 'HUMAN_TAKEN', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  create type leados.message_direction as enum ('INBOUND', 'OUTBOUND');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Core entities
create table if not exists leados.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  notification_email text not null,
  human_forward_number text,
  priority_contact_email text,
  human_required_message_template text,
  close_client_no_response_template text,
  close_attended_other_line_template text,
  score_threshold integer not null default 70 check (score_threshold between 0 and 100),
  strategic_questions jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists leados.client_channels (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references leados.clients(id) on delete cascade,
  phone_number_id text not null unique,
  waba_id text,
  meta_access_token_enc text not null,
  meta_app_secret_enc text not null,
  encryption_version integer not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists leados.client_users (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references leados.clients(id) on delete cascade,
  email text not null unique,
  name text,
  password_hash text,
  created_at timestamptz not null default now()
);

create table if not exists leados.user_clients (
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references leados.clients(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, client_id)
);

create table if not exists leados.client_flows (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references leados.clients(id) on delete cascade,
  name text not null,
  welcome_message text not null,
  is_active boolean not null default true,
  max_steps integer not null default 4,
  max_irrelevant_streak integer not null default 2,
  max_reminders integer not null default 1,
  reminder_delay_minutes integer not null default 30,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists leados.flow_steps (
  id uuid primary key default gen_random_uuid(),
  flow_id uuid not null references leados.client_flows(id) on delete cascade,
  step_order integer not null,
  node_key text,
  prompt_text text not null,
  allow_free_text boolean not null default false,
  created_at timestamptz not null default now(),
  unique (flow_id, step_order)
);

create unique index if not exists uq_leados_flow_steps_node_key
on leados.flow_steps(flow_id, node_key)
where node_key is not null;

create table if not exists leados.flow_step_options (
  id uuid primary key default gen_random_uuid(),
  step_id uuid not null references leados.flow_steps(id) on delete cascade,
  option_order integer not null,
  option_code text not null,
  label_text text not null,
  score_delta integer not null default 0,
  is_contact_human boolean not null default false,
  is_terminal boolean not null default false,
  next_step_id uuid null references leados.flow_steps(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (step_id, option_order),
  constraint ck_leados_option_not_both_terminal_and_human
    check (not (is_contact_human and is_terminal))
);

create table if not exists leados.leads (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references leados.clients(id) on delete cascade,
  wa_user_id text not null,
  wa_profile_name text,
  conversation_status leados.conversation_status not null default 'ACTIVE',
  human_required_reason text,
  human_operator_id uuid,
  current_step integer not null default 1,
  score integer not null default 0,
  extracted_fields jsonb,
  notified_at timestamptz,
  taken_at timestamptz,
  closed_at timestamptz,
  last_user_message_at timestamptz,
  last_bot_message_at timestamptz,
  flow_id uuid null references leados.client_flows(id) on delete set null,
  current_step_id uuid null references leados.flow_steps(id) on delete set null,
  reminders_sent integer not null default 0,
  irrelevant_streak integer not null default 0,
  last_reminder_at timestamptz,
  next_reminder_at timestamptz,
  free_text_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists leados.messages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references leados.clients(id) on delete cascade,
  lead_id uuid not null references leados.leads(id) on delete cascade,
  direction leados.message_direction not null,
  phone_number_id text,
  wa_message_id text,
  text_content text,
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

create table if not exists leados.lead_step_events (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references leados.clients(id) on delete cascade,
  lead_id uuid not null references leados.leads(id) on delete cascade,
  flow_id uuid not null references leados.client_flows(id) on delete cascade,
  step_id uuid not null references leados.flow_steps(id) on delete cascade,
  raw_user_text text,
  selected_option_id uuid null references leados.flow_step_options(id) on delete set null,
  mapping_source text not null check (mapping_source in ('DIRECT_OPTION','AI_MAPPED','FREE_TEXT','OUT_OF_SCOPE')),
  ai_summary text,
  ai_out_of_scope boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists leados.reminder_jobs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references leados.clients(id) on delete cascade,
  lead_id uuid not null references leados.leads(id) on delete cascade,
  reminder_number integer not null,
  status text not null check (status in ('PENDING','SENT','SKIPPED','FAILED')),
  scheduled_for timestamptz not null,
  sent_at timestamptz,
  error_text text,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_leados_clients_name on leados.clients(name);
create index if not exists idx_leados_client_channels_client_id on leados.client_channels(client_id);
create index if not exists idx_leados_client_channels_active on leados.client_channels(is_active);
create index if not exists idx_leados_user_clients_client_id on leados.user_clients(client_id);
create index if not exists idx_leados_flows_client_id on leados.client_flows(client_id);
create index if not exists idx_leados_flow_steps_flow_id on leados.flow_steps(flow_id);
create index if not exists idx_leados_flow_options_step_id on leados.flow_step_options(step_id);
create index if not exists idx_leados_flow_options_next_step_id on leados.flow_step_options(next_step_id);
create index if not exists idx_leados_leads_client_status on leados.leads(client_id, conversation_status);
create index if not exists idx_leados_leads_client_score on leados.leads(client_id, score desc);
create index if not exists idx_leados_leads_client_updated on leados.leads(client_id, updated_at desc);
create index if not exists idx_leados_leads_flow_id on leados.leads(flow_id);
create index if not exists idx_leados_leads_current_step_id on leados.leads(current_step_id);
create index if not exists idx_leados_leads_next_reminder_at on leados.leads(next_reminder_at);
create index if not exists idx_leados_messages_client_id on leados.messages(client_id);
create index if not exists idx_leados_messages_lead_id on leados.messages(lead_id);
create index if not exists idx_leados_messages_client_time on leados.messages(client_id, created_at desc);
create index if not exists idx_leados_messages_phone on leados.messages(phone_number_id);
create index if not exists idx_leados_step_events_client on leados.lead_step_events(client_id);
create index if not exists idx_leados_step_events_lead on leados.lead_step_events(lead_id);
create index if not exists idx_leados_step_events_created_at on leados.lead_step_events(created_at desc);
create index if not exists idx_leados_reminder_jobs_status_time on leados.reminder_jobs(status, scheduled_for);
create index if not exists idx_leados_reminder_jobs_lead on leados.reminder_jobs(lead_id);

create unique index if not exists uq_leados_open_lead_per_user
on leados.leads(client_id, wa_user_id)
where conversation_status in ('ACTIVE', 'HUMAN_REQUIRED', 'HUMAN_TAKEN');

create unique index if not exists uq_leados_messages_wa
on leados.messages(client_id, wa_message_id)
where wa_message_id is not null;

create unique index if not exists uq_leados_active_flow
on leados.client_flows(client_id)
where is_active = true;

create unique index if not exists uq_leados_pending_reminder_per_step
on leados.reminder_jobs(lead_id, reminder_number)
where status = 'PENDING';

-- Trigger helpers
create or replace function leados.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function leados.enqueue_due_reminders()
returns void
language plpgsql
as $$
begin
  insert into leados.reminder_jobs (client_id, lead_id, reminder_number, status, scheduled_for)
  select
    l.client_id,
    l.id,
    l.reminders_sent + 1,
    'PENDING',
    now()
  from leados.leads l
  join leados.client_flows cf on cf.id = l.flow_id and cf.is_active = true
  where l.conversation_status = 'ACTIVE'
    and l.next_reminder_at is not null
    and l.next_reminder_at <= now()
    and l.reminders_sent < greatest(cf.max_reminders, 0)
    and not exists (
      select 1
      from leados.reminder_jobs rj
      where rj.lead_id = l.id
        and rj.reminder_number = l.reminders_sent + 1
        and rj.status = 'PENDING'
    );
end;
$$;

drop trigger if exists trg_leados_clients_updated_at on leados.clients;
create trigger trg_leados_clients_updated_at
before update on leados.clients
for each row execute function leados.set_updated_at();

drop trigger if exists trg_leados_client_channels_updated_at on leados.client_channels;
create trigger trg_leados_client_channels_updated_at
before update on leados.client_channels
for each row execute function leados.set_updated_at();

drop trigger if exists trg_leados_client_flows_updated_at on leados.client_flows;
create trigger trg_leados_client_flows_updated_at
before update on leados.client_flows
for each row execute function leados.set_updated_at();

drop trigger if exists trg_leados_leads_updated_at on leados.leads;
create trigger trg_leados_leads_updated_at
before update on leados.leads
for each row execute function leados.set_updated_at();

-- RLS enable
alter table leados.clients enable row level security;
alter table leados.client_channels enable row level security;
alter table leados.client_users enable row level security;
alter table leados.user_clients enable row level security;
alter table leados.leads enable row level security;
alter table leados.messages enable row level security;
alter table leados.client_flows enable row level security;
alter table leados.flow_steps enable row level security;
alter table leados.flow_step_options enable row level security;
alter table leados.lead_step_events enable row level security;
alter table leados.reminder_jobs enable row level security;

-- User can see own user-client mapping
drop policy if exists leados_user_clients_self on leados.user_clients;
create policy leados_user_clients_self
on leados.user_clients
for select
to authenticated
using (user_id = auth.uid());

-- Tenant isolation (authenticated users)
drop policy if exists leados_clients_tenant_select on leados.clients;
create policy leados_clients_tenant_select
on leados.clients
for select
to authenticated
using (
  exists (
    select 1 from leados.user_clients uc
    where uc.user_id = auth.uid()
      and uc.client_id = leados.clients.id
  )
);

drop policy if exists leados_client_channels_tenant_select on leados.client_channels;
create policy leados_client_channels_tenant_select
on leados.client_channels
for select
to authenticated
using (
  exists (
    select 1 from leados.user_clients uc
    where uc.user_id = auth.uid()
      and uc.client_id = leados.client_channels.client_id
  )
);

drop policy if exists leados_leads_tenant_select on leados.leads;
create policy leados_leads_tenant_select
on leados.leads
for select
to authenticated
using (
  exists (
    select 1 from leados.user_clients uc
    where uc.user_id = auth.uid()
      and uc.client_id = leados.leads.client_id
  )
);

drop policy if exists leados_leads_tenant_update on leados.leads;
create policy leados_leads_tenant_update
on leados.leads
for update
to authenticated
using (
  exists (
    select 1 from leados.user_clients uc
    where uc.user_id = auth.uid()
      and uc.client_id = leados.leads.client_id
  )
)
with check (
  exists (
    select 1 from leados.user_clients uc
    where uc.user_id = auth.uid()
      and uc.client_id = leados.leads.client_id
  )
);

drop policy if exists leados_messages_tenant_select on leados.messages;
create policy leados_messages_tenant_select
on leados.messages
for select
to authenticated
using (
  exists (
    select 1 from leados.user_clients uc
    where uc.user_id = auth.uid()
      and uc.client_id = leados.messages.client_id
  )
);

-- Optional read policies for panel observability
drop policy if exists leados_flows_tenant_select on leados.client_flows;
create policy leados_flows_tenant_select
on leados.client_flows
for select
to authenticated
using (
  exists (
    select 1 from leados.user_clients uc
    where uc.user_id = auth.uid()
      and uc.client_id = leados.client_flows.client_id
  )
);

drop policy if exists leados_flow_steps_tenant_select on leados.flow_steps;
create policy leados_flow_steps_tenant_select
on leados.flow_steps
for select
to authenticated
using (
  exists (
    select 1
    from leados.client_flows cf
    join leados.user_clients uc on uc.client_id = cf.client_id
    where cf.id = leados.flow_steps.flow_id
      and uc.user_id = auth.uid()
  )
);

drop policy if exists leados_flow_options_tenant_select on leados.flow_step_options;
create policy leados_flow_options_tenant_select
on leados.flow_step_options
for select
to authenticated
using (
  exists (
    select 1
    from leados.flow_steps fs
    join leados.client_flows cf on cf.id = fs.flow_id
    join leados.user_clients uc on uc.client_id = cf.client_id
    where fs.id = leados.flow_step_options.step_id
      and uc.user_id = auth.uid()
  )
);

drop policy if exists leados_step_events_tenant_select on leados.lead_step_events;
create policy leados_step_events_tenant_select
on leados.lead_step_events
for select
to authenticated
using (
  exists (
    select 1 from leados.user_clients uc
    where uc.user_id = auth.uid()
      and uc.client_id = leados.lead_step_events.client_id
  )
);

drop policy if exists leados_reminder_jobs_tenant_select on leados.reminder_jobs;
create policy leados_reminder_jobs_tenant_select
on leados.reminder_jobs
for select
to authenticated
using (
  exists (
    select 1 from leados.user_clients uc
    where uc.user_id = auth.uid()
      and uc.client_id = leados.reminder_jobs.client_id
  )
);

-- Service role access (for server-side jobs/webhooks/backoffice)
drop policy if exists leados_service_role_clients on leados.clients;
create policy leados_service_role_clients
on leados.clients
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists leados_service_role_client_channels on leados.client_channels;
create policy leados_service_role_client_channels
on leados.client_channels
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists leados_service_role_client_users on leados.client_users;
create policy leados_service_role_client_users
on leados.client_users
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists leados_service_role_user_clients on leados.user_clients;
create policy leados_service_role_user_clients
on leados.user_clients
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists leados_service_role_leads on leados.leads;
create policy leados_service_role_leads
on leados.leads
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists leados_service_role_messages on leados.messages;
create policy leados_service_role_messages
on leados.messages
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists leados_service_role_flows on leados.client_flows;
create policy leados_service_role_flows
on leados.client_flows
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists leados_service_role_flow_steps on leados.flow_steps;
create policy leados_service_role_flow_steps
on leados.flow_steps
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists leados_service_role_flow_options on leados.flow_step_options;
create policy leados_service_role_flow_options
on leados.flow_step_options
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists leados_service_role_step_events on leados.lead_step_events;
create policy leados_service_role_step_events
on leados.lead_step_events
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists leados_service_role_reminder_jobs on leados.reminder_jobs;
create policy leados_service_role_reminder_jobs
on leados.reminder_jobs
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

-- pg_cron enqueue job each minute (safe re-create)
do $$
declare
  existing_job_id integer;
begin
  select j.jobid
    into existing_job_id
  from cron.job j
  where j.jobname = 'leados-enqueue-reminders'
  limit 1;

  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;

  perform cron.schedule(
    'leados-enqueue-reminders',
    '* * * * *',
    'select leados.enqueue_due_reminders();'
  );
exception
  when undefined_table then
    raise notice 'cron.job not available in this environment; skipping schedule.';
end $$;
