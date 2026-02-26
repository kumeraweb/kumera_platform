-- Tractiva Google Ads templates: tune signature watermark position/size/opacity
-- Keeps one central watermark floating between both signature blocks.

with tractiva as (
  select id
  from billing.services
  where slug = 'tractiva'
  limit 1
)
update billing.contract_templates t
set
  version = 'v5',
  html_template = replace(
    t.html_template,
    '.sig-watermark { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: none; }\n      .sig-watermark img { width: 220px; max-width: 70%; opacity: 0.18; filter: grayscale(100%); }',
    '.sig-watermark { position: absolute; left: 50%; top: -18px; transform: translateX(-50%); pointer-events: none; z-index: 4; }\n      .sig-watermark img { width: 120px; max-width: 120px; height: auto; opacity: 0.12; filter: grayscale(100%); }\n      .sig-box, .sig-grid p { position: relative; z-index: 3; }'
  )
from tractiva s
where t.service_id = s.id
  and t.status = 'active'
  and t.name in (
    'Acuerdo de Prestación de Servicios Google Ads Tractiva.cl (Empresa)',
    'Acuerdo de Prestación de Servicios Google Ads Tractiva.cl (Persona Natural)'
  )
  and t.html_template like '%sig-watermark%';
