-- Paso 04
-- Seed minimo para arrancar operacion (no destructivo)

-- 1) Servicios base (idempotente)
insert into billing.services (slug, name)
values
  ('tuejecutiva', 'Tuejecutiva'),
  ('leados', 'LeadOS')
on conflict (slug) do update
set name = excluded.name;

-- 2) Planes base por servicio (idempotente por combinacion)
insert into billing.plans (service_id, name, price_cents, billing_cycle_days)
select s.id, p.name, p.price_cents, p.billing_cycle_days
from billing.services s
join (
  values
    ('trial', 0, 14),
    ('mensual', 49990, 30)
) as p(name, price_cents, billing_cycle_days)
on true
where s.slug in ('tuejecutiva', 'leados')
  and not exists (
    select 1
    from billing.plans bp
    where bp.service_id = s.id
      and bp.name = p.name
  );

-- 3) Helper: buscar user_id por email para asignar roles
-- Reemplaza el email y ejecuta el bloque de insercion de roles.
-- select id, email from auth.users where email = 'tu-email-admin@dominio.com';

-- 4) Ejemplo de insercion de roles globales (descomenta y reemplaza UUID)
-- insert into core.user_roles (user_id, role, active)
-- values
--   ('00000000-0000-0000-0000-000000000000', 'superadmin', true),
--   ('00000000-0000-0000-0000-000000000000', 'admin_billing', true)
-- on conflict (user_id, role) do update
-- set active = excluded.active;

-- 5) Ejemplo de admin profile para billing (opcional)
-- insert into billing.admin_profiles (user_id, role, email)
-- values ('00000000-0000-0000-0000-000000000000', 'admin', 'tu-email-admin@dominio.com')
-- on conflict (user_id) do update
-- set role = excluded.role,
--     email = excluded.email;

-- 6) Ejemplo de company + suscripcion canónica (opcional)
-- a) Crear company
-- insert into billing.companies (legal_name, rut, address, email, phone, tax_document_type)
-- values ('Cliente Demo SpA', '76.000.000-0', 'Santiago, Chile', 'cliente@demo.cl', '+56911111111', 'factura');
--
-- b) Crear suscripcion (usar service_key + service_subject_id de cada producto)
-- insert into billing.subscriptions (
--   company_id,
--   service_id,
--   plan_id,
--   status,
--   service_key,
--   service_subject_id,
--   period_start,
--   period_end,
--   metadata
-- )
-- select
--   c.id,
--   s.id,
--   p.id,
--   'active',
--   'tuejecutiva',
--   'tuejecutiva-default',
--   now(),
--   now() + interval '30 days',
--   jsonb_build_object('source', 'manual-seed')
-- from billing.companies c
-- join billing.services s on s.slug = 'tuejecutiva'
-- join billing.plans p on p.service_id = s.id and p.name = 'mensual'
-- where c.email = 'cliente@demo.cl'
-- on conflict (company_id, service_id) do update
-- set plan_id = excluded.plan_id,
--     status = excluded.status,
--     service_key = excluded.service_key,
--     service_subject_id = excluded.service_subject_id,
--     period_start = excluded.period_start,
--     period_end = excluded.period_end,
--     metadata = excluded.metadata;
