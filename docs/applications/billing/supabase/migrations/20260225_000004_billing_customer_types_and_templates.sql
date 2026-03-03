-- Billing: customer type (company/person) + representative fields + template target type

alter table billing.companies
  add column if not exists customer_type text not null default 'company' check (customer_type in ('company', 'person')),
  add column if not exists legal_representative_name text,
  add column if not exists legal_representative_rut text;

alter table billing.contract_templates
  add column if not exists target_customer_type text not null default 'company' check (target_customer_type in ('company', 'person', 'any'));

create index if not exists idx_billing_contract_templates_target_customer_type
  on billing.contract_templates(target_customer_type, status, created_at desc);

-- Existing templates become company by default
update billing.contract_templates
set target_customer_type = 'company'
where target_customer_type is null;

-- Seed: person templates for current services (idempotent)
with target_services as (
  select id, slug, name
  from billing.services
  where slug in ('tractiva', 'tuejecutiva', 'leadosku')
)
insert into billing.contract_templates (
  service_id,
  name,
  version,
  status,
  target_customer_type,
  html_template,
  variables_schema
)
select
  s.id,
  case s.slug
    when 'tractiva' then 'Acuerdo Servicio Google Ads Persona Natural'
    when 'tuejecutiva' then 'Acuerdo Servicio TuEjecutiva Persona Natural'
    when 'leadosku' then 'Acuerdo Servicio LeadOS Persona Natural'
    else 'Acuerdo de Servicio Persona Natural'
  end as name,
  'v1' as version,
  'active' as status,
  'person' as target_customer_type,
  case s.slug
    when 'tractiva' then
$$<!doctype html>
<html lang="es">
  <head><meta charset="utf-8" /><title>Acuerdo {{service_name}}</title></head>
  <body style="margin:0;padding:32px;font-family:Arial,sans-serif;color:#0f172a;line-height:1.5;">
    <main style="max-width:860px;margin:0 auto;">
      <h1>Acuerdo de Prestación de Servicios</h1>
      <p><strong>Cliente persona natural:</strong> {{company_legal_name}}, RUT {{company_rut}}, domicilio {{company_address}}, correo {{company_email}}.</p>
      <p><strong>Servicio:</strong> {{service_name}} - {{plan_name}}</p>
      <p><strong>Valor mensual:</strong> ${{monthly_amount_clp}} CLP + IVA</p>
      <p style="font-size:12px;color:#475569;">ID Suscripción: {{subscription_id}} · Fecha: {{generated_date}}</p>
    </main>
  </body>
</html>$$
    when 'tuejecutiva' then
$$<!doctype html>
<html lang="es">
  <head><meta charset="utf-8" /><title>Acuerdo {{service_name}}</title></head>
  <body style="margin:0;padding:32px;font-family:Arial,sans-serif;color:#0f172a;line-height:1.5;">
    <main style="max-width:860px;margin:0 auto;">
      <h1>Acuerdo de Prestación de Servicios</h1>
      <p><strong>Cliente persona natural:</strong> {{company_legal_name}}, RUT {{company_rut}}, domicilio {{company_address}}, correo {{company_email}}.</p>
      <p><strong>Servicio:</strong> {{service_name}} - {{plan_name}}</p>
      <p><strong>Valor mensual:</strong> ${{monthly_amount_clp}} CLP + IVA</p>
      <p style="font-size:12px;color:#475569;">ID Suscripción: {{subscription_id}} · Fecha: {{generated_date}}</p>
    </main>
  </body>
</html>$$
    when 'leadosku' then
$$<!doctype html>
<html lang="es">
  <head><meta charset="utf-8" /><title>Acuerdo {{service_name}}</title></head>
  <body style="margin:0;padding:32px;font-family:Arial,sans-serif;color:#0f172a;line-height:1.5;">
    <main style="max-width:860px;margin:0 auto;">
      <h1>Acuerdo de Prestación de Servicios</h1>
      <p><strong>Cliente persona natural:</strong> {{company_legal_name}}, RUT {{company_rut}}, domicilio {{company_address}}, correo {{company_email}}.</p>
      <p><strong>Servicio:</strong> {{service_name}} - {{plan_name}}</p>
      <p><strong>Valor mensual:</strong> ${{monthly_amount_clp}} CLP + IVA</p>
      <p style="font-size:12px;color:#475569;">ID Suscripción: {{subscription_id}} · Fecha: {{generated_date}}</p>
    </main>
  </body>
</html>$$
    else
$$<html><body><h1>Acuerdo Servicio Persona Natural</h1></body></html>$$
  end as html_template,
  jsonb_build_object(
    'company_legal_name', jsonb_build_object('type','string','required',true),
    'company_rut', jsonb_build_object('type','string','required',true),
    'company_address', jsonb_build_object('type','string','required',true),
    'company_email', jsonb_build_object('type','string','required',true),
    'company_phone', jsonb_build_object('type','string','required',true),
    'service_name', jsonb_build_object('type','string','required',true),
    'plan_name', jsonb_build_object('type','string','required',true),
    'monthly_amount_clp', jsonb_build_object('type','string','required',true),
    'generated_date', jsonb_build_object('type','string','required',true),
    'subscription_id', jsonb_build_object('type','string','required',true)
  ) as variables_schema
from target_services s
where not exists (
  select 1
  from billing.contract_templates t
  where t.service_id = s.id
    and t.version = 'v1'
    and t.target_customer_type = 'person'
);
