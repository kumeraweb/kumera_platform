-- Kumera Messaging namespace migration
-- Estado: PREPARADA
-- Objetivo:
-- 1) mover schema `leados` -> `kumeramessaging`
-- 2) habilitar rol global `admin_kumeramessaging`
-- 3) migrar service keys/slugs legacy a `kumeramessaging`
--
-- IMPORTANTE:
-- No envolver este archivo completo en una sola transaccion.
-- Postgres no permite usar un nuevo valor de enum en la misma transaccion
-- en la que fue agregado.

do $$
begin
  if exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'core'
      and t.typname = 'global_role'
  ) then
    alter type core.global_role add value if not exists 'admin_kumeramessaging';
  end if;
exception
  when duplicate_object then null;
end $$;

-- A partir de aqui, el valor del enum ya debe estar comprometido.
-- Si corres este script en Supabase SQL Editor, cada sentencia queda
-- efectivamente separada y es seguro reutilizar el enum nuevo.

insert into core.user_roles (user_id, role, active)
select ur.user_id, 'admin_kumeramessaging'::core.global_role, ur.active
from core.user_roles ur
where ur.role = 'admin_leados'
on conflict (user_id, role) do update
set active = excluded.active;

do $$
declare
  canonical_service_id uuid;
begin
  insert into billing.services (slug, name)
  select 'kumeramessaging', 'Kumera Messaging'
  where not exists (
    select 1 from billing.services where slug = 'kumeramessaging'
  );

  select id
  into canonical_service_id
  from billing.services
  where slug = 'kumeramessaging'
  order by created_at asc nulls last, id asc
  limit 1;

  if canonical_service_id is null then
    raise exception 'Could not resolve canonical billing service kumeramessaging';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'billing'
      and table_name = 'plans'
      and column_name = 'service_id'
  ) then
    update billing.plans
    set service_id = canonical_service_id
    where service_id in (
      select id
      from billing.services
      where slug in ('leados', 'leadosku')
        and id <> canonical_service_id
    );
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'billing'
      and table_name = 'contract_templates'
      and column_name = 'service_id'
  ) then
    update billing.contract_templates
    set service_id = canonical_service_id
    where service_id in (
      select id
      from billing.services
      where slug in ('leados', 'leadosku')
        and id <> canonical_service_id
    );
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'billing'
      and table_name = 'subscriptions'
      and column_name = 'service_id'
  ) then
    update billing.subscriptions
    set service_id = canonical_service_id
    where service_id in (
      select id
      from billing.services
      where slug in ('leados', 'leadosku')
        and id <> canonical_service_id
    );
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'billing'
      and table_name = 'subscriptions'
      and column_name = 'service_key'
  ) then
    update billing.subscriptions
    set service_key = 'kumeramessaging'
    where service_key in ('leados', 'leadosku');
  end if;

  update billing.services
  set name = 'Kumera Messaging'
  where id = canonical_service_id;

  delete from billing.services
  where slug in ('leados', 'leadosku')
    and id <> canonical_service_id;
end $$;

do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'leados')
     and not exists (select 1 from information_schema.schemata where schema_name = 'kumeramessaging') then
    execute 'alter schema leados rename to kumeramessaging';
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from information_schema.schemata where schema_name = 'kumeramessaging'
  ) then
    if exists (
      select 1
      from cron.job
      where jobname = 'leados-enqueue-reminders'
    ) then
      perform cron.unschedule('leados-enqueue-reminders');
    end if;

    if not exists (
      select 1
      from cron.job
      where jobname = 'kumeramessaging-enqueue-reminders'
    ) then
      perform cron.schedule(
        'kumeramessaging-enqueue-reminders',
        '* * * * *',
        'select kumeramessaging.enqueue_due_reminders();'
      );
    end if;
  end if;
exception
  when undefined_table then null;
  when invalid_schema_name then null;
end $$;

-- Verificaciones sugeridas post-migracion:
-- select schema_name from information_schema.schemata where schema_name in ('leados', 'kumeramessaging');
-- select slug, name from billing.services where slug in ('leados', 'leadosku', 'kumeramessaging');
-- select distinct role from core.user_roles where role in ('admin_leados', 'admin_kumeramessaging');
