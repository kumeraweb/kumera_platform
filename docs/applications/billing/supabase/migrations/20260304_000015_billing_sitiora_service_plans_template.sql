-- Billing: seed Sitiora service, plans and default contract template (idempotent)

insert into billing.services (slug, name)
select 'sitiora', 'Sitiora'
where not exists (select 1 from billing.services where slug = 'sitiora');

with svc as (
  select id
  from billing.services
  where slug = 'sitiora'
)
insert into billing.plans (service_id, name, price_cents, billing_cycle_days)
select svc.id, p.name, p.price_cents, 30
from svc
join (
  values
    ('Landing', 24900000),
    ('Web Corporativa', 59000000),
    ('E-commerce / Custom', 149000000)
) as p(name, price_cents) on true
where not exists (
  select 1
  from billing.plans bp
  where bp.service_id = svc.id
    and lower(bp.name) = lower(p.name)
);

with svc as (
  select id
  from billing.services
  where slug = 'sitiora'
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
  svc.id,
  'Acuerdo Servicio Sitiora',
  'v1',
  'active',
  'any',
$$<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Acuerdo de Prestacion de Servicios - {{service_name}}</title>
    <style>
      body { margin: 0; padding: 32px; font-family: Arial, sans-serif; color: #0f172a; line-height: 1.5; }
      .wrap { max-width: 860px; margin: 0 auto; }
      h1 { margin: 0 0 8px; font-size: 28px; }
      h2 { margin: 20px 0 8px; font-size: 18px; }
      .box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin: 10px 0; }
      .small { font-size: 12px; color: #475569; }
    </style>
  </head>
  <body>
    <main class="wrap">
      <h1>Acuerdo de Prestacion de Servicios</h1>
      <p>Servicio: {{service_name}} · Plan: {{plan_name}} · Fecha: {{generated_date}}</p>
      <h2>Partes</h2>
      <div class="box">
        <p><strong>Prestador:</strong> Kumera SpA.</p>
        <p><strong>Cliente:</strong> {{company_legal_name}}, RUT {{company_rut}}, domicilio {{company_address}}, correo {{company_email}}, telefono {{company_phone}}.</p>
      </div>
      <h2>Objeto</h2>
      <p>Diseno, desarrollo e implementacion de activos digitales web segun alcance del plan contratado.</p>
      <h2>Honorarios</h2>
      <p>Monto mensual o pactado: <strong>${{monthly_amount_clp}} CLP + IVA</strong>.</p>
      <h2>Vigencia</h2>
      <p>La vigencia y entregables se rigen por el plan seleccionado o anexo comercial aprobado por ambas partes.</p>
      <p class="small">ID Suscripcion: {{subscription_id}} · Forma documento tributario: {{tax_document_type}}</p>
    </main>
  </body>
</html>$$,
  jsonb_build_object(
    'company_legal_name', jsonb_build_object('type','string','required',true),
    'company_rut', jsonb_build_object('type','string','required',true),
    'company_address', jsonb_build_object('type','string','required',true),
    'company_email', jsonb_build_object('type','string','required',true),
    'company_phone', jsonb_build_object('type','string','required',true),
    'tax_document_type', jsonb_build_object('type','string','required',true,'enum',jsonb_build_array('factura','boleta')),
    'service_name', jsonb_build_object('type','string','required',true),
    'service_slug', jsonb_build_object('type','string','required',true),
    'plan_name', jsonb_build_object('type','string','required',true),
    'monthly_amount_clp', jsonb_build_object('type','string','required',true),
    'generated_date', jsonb_build_object('type','string','required',true),
    'subscription_id', jsonb_build_object('type','string','required',true)
  )
from svc
where not exists (
  select 1
  from billing.contract_templates t
  where t.service_id = svc.id
    and t.name = 'Acuerdo Servicio Sitiora'
    and t.version = 'v1'
);
