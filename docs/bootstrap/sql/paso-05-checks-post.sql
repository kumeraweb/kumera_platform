-- Paso 05
-- Checks post-instalacion / post-migracion

-- 1) Schemas esperados
select schema_name
from information_schema.schemata
where schema_name in ('core', 'billing', 'tuejecutiva', 'leados')
order by schema_name;

-- 2) Tablas por schema
select table_schema, count(*) as total_tables
from information_schema.tables
where table_type = 'BASE TABLE'
  and table_schema in ('core', 'billing', 'tuejecutiva', 'leados')
group by table_schema
order by table_schema;

-- 3) Detectar tablas de negocio en public (debe ser 0 o solo tablas tecnicas esperadas)
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_type = 'BASE TABLE'
order by table_name;

-- 4) RLS habilitado en tablas de negocio
select n.nspname as schema_name, c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where c.relkind = 'r'
  and n.nspname in ('core', 'billing', 'tuejecutiva', 'leados')
order by schema_name, table_name;

-- 5) Roles globales cargados
select role, count(*) as total
from core.user_roles
group by role
order by role;

-- 6) Subscriptions canónicas
select service_key, status, count(*) as total
from billing.subscriptions
group by service_key, status
order by service_key, status;
