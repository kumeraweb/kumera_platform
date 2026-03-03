-- Seed: default contract templates per service (idempotent)

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
  html_template,
  variables_schema
)
select
  s.id,
  case s.slug
    when 'tractiva' then 'Acuerdo Servicio Google Ads'
    when 'tuejecutiva' then 'Acuerdo Servicio TuEjecutiva'
    when 'leadosku' then 'Acuerdo Servicio LeadOS'
    else 'Acuerdo de Servicio'
  end as name,
  'v1' as version,
  'active' as status,
  case s.slug
    when 'tractiva' then
$$<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Acuerdo de Prestación de Servicios - {{service_name}}</title>
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
      <h1>Acuerdo de Prestación de Servicios</h1>
      <p>Servicio: {{service_name}} · Plan: {{plan_name}} · Fecha: {{generated_date}}</p>
      <h2>Partes</h2>
      <div class="box">
        <p><strong>Prestador:</strong> Kumera SpA.</p>
        <p><strong>Cliente:</strong> {{company_legal_name}}, RUT {{company_rut}}, domicilio {{company_address}}, correo {{company_email}}, teléfono {{company_phone}}.</p>
      </div>
      <h2>Objeto</h2>
      <p>Administración y optimización de campañas de Google Ads para el Cliente.</p>
      <h2>Honorarios</h2>
      <p>Monto mensual: <strong>${{monthly_amount_clp}} CLP + IVA</strong>.</p>
      <h2>Vigencia</h2>
      <p>Vigencia mensual con renovación automática mientras la suscripción permanezca activa.</p>
      <p class="small">ID Suscripción: {{subscription_id}} · Forma documento tributario: {{tax_document_type}}</p>
    </main>
  </body>
</html>$$
    when 'tuejecutiva' then
$$<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Acuerdo de Prestación de Servicios - {{service_name}}</title>
  </head>
  <body style="margin:0;padding:32px;font-family:Arial,sans-serif;color:#0f172a;line-height:1.5;">
    <main style="max-width:860px;margin:0 auto;">
      <h1>Acuerdo de Prestación de Servicios</h1>
      <p>Servicio: {{service_name}} · Plan: {{plan_name}} · Fecha: {{generated_date}}</p>
      <p><strong>Cliente:</strong> {{company_legal_name}} ({{company_rut}})</p>
      <p><strong>Alcance:</strong> Servicio TuEjecutiva según plan contratado.</p>
      <p><strong>Honorarios:</strong> ${{monthly_amount_clp}} CLP + IVA mensual.</p>
      <p><strong>Contacto cliente:</strong> {{company_email}} / {{company_phone}}</p>
      <p style="font-size:12px;color:#475569;">ID Suscripción: {{subscription_id}}</p>
    </main>
  </body>
</html>$$
    when 'leadosku' then
$$<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Acuerdo de Prestación de Servicios - {{service_name}}</title>
  </head>
  <body style="margin:0;padding:32px;font-family:Arial,sans-serif;color:#0f172a;line-height:1.5;">
    <main style="max-width:860px;margin:0 auto;">
      <h1>Acuerdo de Prestación de Servicios</h1>
      <p>Servicio: {{service_name}} · Plan: {{plan_name}} · Fecha: {{generated_date}}</p>
      <p><strong>Cliente:</strong> {{company_legal_name}} ({{company_rut}})</p>
      <p><strong>Alcance:</strong> Servicio LeadOS según plan contratado.</p>
      <p><strong>Honorarios:</strong> ${{monthly_amount_clp}} CLP + IVA mensual.</p>
      <p><strong>Contacto cliente:</strong> {{company_email}} / {{company_phone}}</p>
      <p style="font-size:12px;color:#475569;">ID Suscripción: {{subscription_id}}</p>
    </main>
  </body>
</html>$$
    else
$$<html><body><h1>Acuerdo de Prestación de Servicios</h1><p>{{company_legal_name}}</p></body></html>$$
  end as html_template,
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
  ) as variables_schema
from target_services s
where not exists (
  select 1
  from billing.contract_templates t
  where t.service_id = s.id
    and t.name = case s.slug
      when 'tractiva' then 'Acuerdo Servicio Google Ads'
      when 'tuejecutiva' then 'Acuerdo Servicio TuEjecutiva'
      when 'leadosku' then 'Acuerdo Servicio LeadOS'
      else 'Acuerdo de Servicio'
    end
    and t.version = 'v1'
);
