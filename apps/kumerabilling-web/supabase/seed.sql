insert into services (slug, name)
values
  ('tractiva', 'Tractiva'),
  ('tuejecutiva', 'TuEjecutiva'),
  ('leados', 'LeadOS')
on conflict (slug) do nothing;

insert into plans (service_id, name, price_cents, billing_cycle_days)
select id, 'Plan Base', 9000000, 30
from services
on conflict do nothing;
