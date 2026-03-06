-- Kumera Messaging namespace migration
-- Estado: PREPARADA, NO EJECUTAR hasta desplegar primero el codigo con fallback dual.
-- Objetivo:
-- 1) mover schema `leados` -> `kumeramessaging`
-- 2) habilitar rol global `admin_kumeramessaging`
-- 3) migrar service keys/slugs legacy a `kumeramessaging`

begin;

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

insert into core.user_roles (user_id, role, active)
select ur.user_id, 'admin_kumeramessaging'::core.global_role, ur.active
from core.user_roles ur
where ur.role = 'admin_leados'
on conflict (user_id, role) do update
set active = excluded.active;

update billing.services
set slug = 'kumeramessaging',
    name = 'Kumera Messaging'
where slug in ('leados', 'leadosku');

update billing.subscriptions
set service_key = 'kumeramessaging'
where service_key in ('leados', 'leadosku');

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

commit;

-- Verificaciones sugeridas post-migracion:
-- select schema_name from information_schema.schemata where schema_name in ('leados', 'kumeramessaging');
-- select slug, name from billing.services where slug in ('leados', 'leadosku', 'kumeramessaging');
-- select distinct role from core.user_roles where role in ('admin_leados', 'admin_kumeramessaging');
