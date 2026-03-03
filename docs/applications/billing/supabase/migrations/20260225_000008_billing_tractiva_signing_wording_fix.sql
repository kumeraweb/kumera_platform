-- Tractiva templates: remove "dos ejemplares" wording and mark Kumera signature as already signed digitally

with s as (
  select id
  from billing.services
  where slug = 'tractiva'
  limit 1
)
update billing.contract_templates t
set html_template = regexp_replace(
  regexp_replace(
    t.html_template,
    'En señal de aceptación, las partes firman en dos ejemplares \(o mediante firma electrónica simple\)\.',
    'En señal de aceptación, este acuerdo se formaliza en un ejemplar digital descargable, con firma electrónica simple.',
    'g'
  ),
  'Firma: ________________________</p>',
  'Firma: Firmado electrónicamente por Kumera · Fecha: {{kumera_signed_date}}</p>',
  'g'
)
from s
where t.service_id = s.id
  and t.status = 'active'
  and t.target_customer_type in ('company', 'person')
  and t.name like 'Acuerdo de Prestación de Servicios Google Ads Tractiva.cl (%';
