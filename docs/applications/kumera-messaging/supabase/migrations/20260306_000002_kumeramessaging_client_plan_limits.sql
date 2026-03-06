-- Kumera Messaging: planes y límites de consumo por cliente
-- Idempotente. Compatible con schema legacy (`leados`) y nuevo (`kumeramessaging`).

do $$
declare
  target_schema text;
begin
  foreach target_schema in array array['kumeramessaging', 'leados']
  loop
    if exists (
      select 1
      from information_schema.schemata
      where schema_name = target_schema
    ) then
      execute format(
        'alter table %I.clients
          add column if not exists billing_plan_code text,
          add column if not exists billing_plan_name text,
          add column if not exists monthly_inbound_limit integer,
          add column if not exists monthly_ai_checks_limit integer,
          add column if not exists enforce_monthly_limits boolean;',
        target_schema
      );

      execute format(
        'update %I.clients
         set
           billing_plan_code = coalesce(billing_plan_code, ''emprendedor_500''),
           billing_plan_name = coalesce(billing_plan_name, ''Emprendedor''),
           monthly_inbound_limit = coalesce(monthly_inbound_limit, 500),
           monthly_ai_checks_limit = coalesce(monthly_ai_checks_limit, 250),
           enforce_monthly_limits = coalesce(enforce_monthly_limits, true);',
        target_schema
      );

      execute format(
        'alter table %I.clients
          alter column billing_plan_code set default ''emprendedor_500'',
          alter column billing_plan_name set default ''Emprendedor'',
          alter column monthly_inbound_limit set default 500,
          alter column monthly_ai_checks_limit set default 250,
          alter column enforce_monthly_limits set default true;',
        target_schema
      );

      execute format(
        'alter table %I.clients
          alter column billing_plan_code set not null,
          alter column billing_plan_name set not null,
          alter column monthly_inbound_limit set not null,
          alter column monthly_ai_checks_limit set not null,
          alter column enforce_monthly_limits set not null;',
        target_schema
      );

      if not exists (
        select 1
        from pg_constraint c
        join pg_class t on t.oid = c.conrelid
        join pg_namespace n on n.oid = t.relnamespace
        where c.conname = target_schema || '_clients_monthly_inbound_limit_check'
          and n.nspname = target_schema
          and t.relname = 'clients'
      ) then
        execute format(
          'alter table %I.clients add constraint %I check (monthly_inbound_limit >= 100);',
          target_schema,
          target_schema || '_clients_monthly_inbound_limit_check'
        );
      end if;

      if not exists (
        select 1
        from pg_constraint c
        join pg_class t on t.oid = c.conrelid
        join pg_namespace n on n.oid = t.relnamespace
        where c.conname = target_schema || '_clients_monthly_ai_checks_limit_check'
          and n.nspname = target_schema
          and t.relname = 'clients'
      ) then
        execute format(
          'alter table %I.clients add constraint %I check (monthly_ai_checks_limit >= 50);',
          target_schema,
          target_schema || '_clients_monthly_ai_checks_limit_check'
        );
      end if;
    end if;
  end loop;
end $$;
