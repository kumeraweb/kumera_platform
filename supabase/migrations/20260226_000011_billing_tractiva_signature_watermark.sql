-- Tractiva Google Ads templates: add centered signature watermark image (/sign.png)
-- Uses one watermark between both signatures with low opacity.

with tractiva as (
  select id
  from billing.services
  where slug = 'tractiva'
  limit 1
)
update billing.contract_templates t
set
  version = 'v4',
  html_template = regexp_replace(
    replace(
      t.html_template,
      '.sig-grid { margin-top: 26px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }',
      '.sig-grid { margin-top: 26px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; position: relative; }\n      .sig-watermark { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: none; }\n      .sig-watermark img { width: 220px; max-width: 70%; opacity: 0.18; filter: grayscale(100%); }'
    ),
    '<div class="sig-grid">',
    '<div class="sig-grid">\n        <div class="sig-watermark"><img src="/sign.png" alt="Firmado" /></div>'
  )
from tractiva s
where t.service_id = s.id
  and t.status = 'active'
  and t.name in (
    'Acuerdo de Prestación de Servicios Google Ads Tractiva.cl (Empresa)',
    'Acuerdo de Prestación de Servicios Google Ads Tractiva.cl (Persona Natural)'
  )
  and t.html_template not like '%sig-watermark%';
