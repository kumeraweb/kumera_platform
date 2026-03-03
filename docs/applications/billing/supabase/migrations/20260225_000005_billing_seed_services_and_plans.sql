-- Billing: ensure canonical services and plans exist for Kumera platform (idempotent)

insert into billing.services (slug, name)
select 'tractiva', 'Tractiva'
where not exists (select 1 from billing.services where slug = 'tractiva');

insert into billing.services (slug, name)
select 'tuejecutiva', 'TuEjecutiva'
where not exists (select 1 from billing.services where slug = 'tuejecutiva');

insert into billing.services (slug, name)
select 'leadosku', 'LeadOS'
where not exists (select 1 from billing.services where slug = 'leadosku');

with svc as (
  select id, slug
  from billing.services
  where slug in ('tractiva', 'tuejecutiva', 'leadosku')
)
insert into billing.plans (service_id, name, price_cents, billing_cycle_days)
select svc.id, p.name, p.price_cents, 30
from svc
join (
  values
    ('tractiva', 'Plan Base', 5900000),
    ('tractiva', 'Plan Crecimiento', 8900000),
    ('tuejecutiva', 'Bronce', 2500000),
    ('tuejecutiva', 'Plata', 4900000),
    ('tuejecutiva', 'Oro', 12000000),
    ('leadosku', 'Mensual', 4990000)
) as p(slug, name, price_cents) on p.slug = svc.slug
where not exists (
  select 1
  from billing.plans bp
  where bp.service_id = svc.id
    and lower(bp.name) = lower(p.name)
);
