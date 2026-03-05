-- Billing: reprice Sitiora plans for volume-based acquisition (idempotent)
-- Strategy:
-- - Entry low-ticket for entrepreneurs/professionals.
-- - Mid-ticket for higher conversion landing/multipage work.
-- - High-ticket filters for custom and ecommerce projects.
-- - All Sitiora plans remain one-time (billing_cycle_days = 0).

with svc as (
  select id
  from billing.services
  where slug = 'sitiora'
)
update billing.plans p
set
  name = 'Start',
  price_cents = 7900000,
  billing_cycle_days = 0
from svc
where p.service_id = svc.id
  and lower(p.name) = 'landing';

with svc as (
  select id
  from billing.services
  where slug = 'sitiora'
)
update billing.plans p
set
  name = 'Growth',
  price_cents = 14900000,
  billing_cycle_days = 0
from svc
where p.service_id = svc.id
  and lower(p.name) = 'web corporativa';

with svc as (
  select id
  from billing.services
  where slug = 'sitiora'
)
update billing.plans p
set
  name = 'Pro',
  price_cents = 24900000,
  billing_cycle_days = 0
from svc
where p.service_id = svc.id
  and lower(p.name) = 'e-commerce / custom';

with svc as (
  select id
  from billing.services
  where slug = 'sitiora'
)
insert into billing.plans (service_id, name, price_cents, billing_cycle_days)
select svc.id, p.name, p.price_cents, 0
from svc
join (
  values
    ('Start', 7900000),
    ('Growth', 14900000),
    ('Pro', 24900000),
    ('Custom', 49000000),
    ('E-commerce', 129000000)
) as p(name, price_cents) on true
where not exists (
  select 1
  from billing.plans bp
  where bp.service_id = svc.id
    and lower(bp.name) = lower(p.name)
);

-- Normalize pricing + one-time cycle for canonical plan names in case they already exist.
with svc as (
  select id
  from billing.services
  where slug = 'sitiora'
), target as (
  select *
  from (
    values
      ('Start', 7900000),
      ('Growth', 14900000),
      ('Pro', 24900000),
      ('Custom', 49000000),
      ('E-commerce', 129000000)
  ) as t(name, price_cents)
)
update billing.plans p
set
  price_cents = target.price_cents,
  billing_cycle_days = 0
from svc, target
where p.service_id = svc.id
  and lower(p.name) = lower(target.name);
