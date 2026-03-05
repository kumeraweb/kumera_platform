-- Billing: normalize Sitiora as one-time billing (idempotent)

-- 1) Ensure catalog plans for Sitiora are one-time (no automatic monthly renewal).
update billing.plans p
set billing_cycle_days = 0
from billing.services s
where p.service_id = s.id
  and s.slug = 'sitiora'
  and p.billing_cycle_days <> 0;

-- 2) Remove pending future renewals already generated for Sitiora subscriptions
--    that already have at least one validated payment.
delete from billing.payments p
using billing.subscriptions sub, billing.services s
where p.subscription_id = sub.id
  and sub.service_id = s.id
  and s.slug = 'sitiora'
  and p.status = 'pending'
  and p.due_date > now()
  and exists (
    select 1
    from billing.payments pv
    where pv.subscription_id = sub.id
      and pv.status = 'validated'
  );
