-- Tractiva Google Ads templates: polish wording + centered title (company/person)

with tractiva as (
  select id
  from billing.services
  where slug = 'tractiva'
  limit 1
)
update billing.contract_templates t
set
  version = 'v3',
  html_template = replace(
    replace(
      t.html_template,
      'h1 { margin: 0 0 10px; font-size: 26px; line-height: 1.25; }',
      'h1 { margin: 0 0 14px; font-size: 26px; line-height: 1.25; text-align: center; }'
    ),
    '<p><strong>1.2. Cliente:</strong> {{company_legal_name}}, RUT {{company_rut}}, domicilio {{company_address}}, correo {{company_email}}, representado por {{legal_representative_name}} (RUT {{legal_representative_rut}}) (en adelante, el “Cliente”).</p>',
    '<p><strong>1.2. Cliente:</strong> {{company_legal_name}}, RUT {{company_rut}}, domicilio {{company_address}}, correo {{company_email}}, representado por {{legal_representative_name}}, RUT {{legal_representative_rut}}, en adelante, el Cliente.</p>'
  )
from tractiva s
where t.service_id = s.id
  and t.target_customer_type = 'company'
  and t.status = 'active'
  and t.name = 'Acuerdo de Prestación de Servicios Google Ads Tractiva.cl (Empresa)';

with tractiva as (
  select id
  from billing.services
  where slug = 'tractiva'
  limit 1
)
update billing.contract_templates t
set
  version = 'v3',
  html_template = replace(
    replace(
      t.html_template,
      'h1 { margin: 0 0 10px; font-size: 26px; line-height: 1.25; }',
      'h1 { margin: 0 0 14px; font-size: 26px; line-height: 1.25; text-align: center; }'
    ),
    '<p><strong>1.2. Cliente:</strong> {{company_legal_name}}, RUT {{company_rut}}, domicilio {{company_address}}, correo {{company_email}} (en adelante, el “Cliente”).</p>',
    '<p><strong>1.2. Cliente:</strong> {{company_legal_name}}, RUT {{company_rut}}, domicilio {{company_address}}, correo {{company_email}}, en adelante, el Cliente.</p>'
  )
from tractiva s
where t.service_id = s.id
  and t.target_customer_type = 'person'
  and t.status = 'active'
  and t.name = 'Acuerdo de Prestación de Servicios Google Ads Tractiva.cl (Persona Natural)';
