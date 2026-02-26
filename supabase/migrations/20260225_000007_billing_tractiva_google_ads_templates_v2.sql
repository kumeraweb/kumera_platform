-- Tractiva Google Ads: legal base templates v2 (company + person)
-- Replaces active tractiva templates for clearer legal wording and signature block.

with tractiva as (
  select id
  from billing.services
  where slug = 'tractiva'
  limit 1
)
update billing.contract_templates t
set
  name = 'Acuerdo de Prestación de Servicios Google Ads Tractiva.cl (Empresa)',
  version = 'v2',
  html_template =
$$<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Acuerdo de Prestación de Servicios Google Ads Tractiva.cl</title>
    <style>
      body { margin: 0; padding: 28px; font-family: Arial, sans-serif; color: #0f172a; line-height: 1.5; }
      .wrap { max-width: 920px; margin: 0 auto; }
      h1 { margin: 0 0 10px; font-size: 26px; line-height: 1.25; }
      h2 { margin: 18px 0 8px; font-size: 18px; }
      p { margin: 0 0 8px; }
      ul { margin: 0 0 10px 18px; padding: 0; }
      li { margin: 3px 0; }
      .sig-grid { margin-top: 26px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
      .sig-box { border-top: 1px solid #334155; padding-top: 8px; min-height: 68px; }
      .muted { font-size: 12px; color: #475569; }
    </style>
  </head>
  <body>
    <main class="wrap">
      <h1>ACUERDO DE PRESTACIÓN DE SERVICIOS<br />Google Ads – Tractiva.cl ({{plan_name}})</h1>

      <h2>1. Partes</h2>
      <p><strong>1.1. Prestador:</strong> SERVICIOS DIGITALES KUMERA SpA, RUT 78.299.262-7, domicilio Sta. Lucía 75 P Valdivia, Concepción, Región del Biobío, Chile, correo contacto@kumeraweb.com, representada por Javier Nicolás Figueroa Aguayo, RUT 16.370.698-9 (en adelante, “Kumera”).</p>
      <p><strong>1.2. Cliente:</strong> {{company_legal_name}}, RUT {{company_rut}}, domicilio {{company_address}}, correo {{company_email}}, representado por {{legal_representative_name}} (RUT {{legal_representative_rut}}) (en adelante, el “Cliente”).</p>

      <h2>2. Objeto</h2>
      <p>El Cliente encarga y Kumera acepta prestar servicios de administración y optimización de campañas publicitarias en Google Ads, conforme al alcance indicado en este acuerdo.</p>

      <h2>3. Alcance del servicio</h2>
      <p><strong>3.1. Administración Google Ads (mensual – {{plan_name}}):</strong></p>
      <ul>
        <li>Creación o configuración de la cuenta Google Ads (búsqueda).</li>
        <li>Estructura inicial de campañas (grupos de anuncios, palabras clave, anuncios).</li>
        <li>Implementación de extensiones.</li>
        <li>Configuración básica de medición (conversiones y eventos).</li>
        <li>Monitoreo y optimización continua (negativas, pujas, segmentación, calidad de anuncios).</li>
        <li>Reporte periódico con métricas clave y acciones realizadas.</li>
        <li>Recomendaciones estratégicas para mejorar captación.</li>
      </ul>
      <p><strong>3.2. Fuera de alcance (salvo acuerdo escrito):</strong></p>
      <ul>
        <li>Diseño o rediseño de sitio web.</li>
        <li>Gestión de campañas en otras plataformas (Meta, TikTok u otras).</li>
        <li>Producción audiovisual o diseño gráfico avanzado.</li>
        <li>Atención comercial de los prospectos del Cliente.</li>
        <li>Servicios legales o contables.</li>
      </ul>

      <h2>4. Responsabilidades del Cliente</h2>
      <ul>
        <li>Proveer información veraz y oportuna sobre sus servicios.</li>
        <li>Aprobar contenidos y estrategias dentro de plazos razonables.</li>
        <li>Mantener operativos sus medios de contacto.</li>
        <li>Pagar directamente a Google el presupuesto publicitario.</li>
        <li>Entregar accesos necesarios (cuentas, Analytics, sitio web) o autorizar su creación.</li>
      </ul>

      <h2>5. Plazos y modalidad de trabajo</h2>
      <p><strong>5.1.</strong> El servicio se presta en modalidad mensual, con ajustes continuos.</p>
      <p><strong>5.2.</strong> La optimización es iterativa; los resultados pueden variar por estacionalidad, competencia, presupuesto y otros factores externos.</p>

      <h2>6. Presupuesto publicitario y pagos a Google</h2>
      <p><strong>6.1.</strong> El presupuesto de publicidad se paga directamente a Google por el Cliente.</p>
      <p><strong>6.2.</strong> Kumera administra configuración y optimización, pero no garantiza un volumen específico de leads o ventas.</p>

      <h2>7. Propiedad y titularidad de la cuenta Google Ads</h2>
      <p><strong>7.1.</strong> La cuenta Google Ads y sus activos serán de propiedad del Cliente.</p>
      <p><strong>7.2.</strong> Si la cuenta es creada por Kumera, el Cliente será incorporado como administrador principal.</p>
      <p><strong>7.3.</strong> Al término del servicio, se entregarán accesos y respaldos razonables.</p>

      <h2>8. Valores, facturación y forma de pago</h2>
      <p><strong>8.1.</strong> Administración mensual {{plan_name}}: ${{monthly_amount_clp}} CLP + IVA.</p>
      <p><strong>8.2.</strong> El pago mensual debe realizarse por adelantado para la continuidad del servicio.</p>
      <p><strong>8.3. Forma de pago (transferencia bancaria):</strong><br />
      Nombre empresa: SERVICIOS DIGITALES KUMERA SpA<br />
      RUT: 78.299.262-7<br />
      Banco: Banco de Créditos e Inversiones<br />
      Cuenta Corriente: 70818970<br />
      Correo: contacto@kumeraweb.com</p>

      <h2>9. Vigencia, renovación y término</h2>
      <p><strong>9.1.</strong> Este acuerdo tiene duración inicial de 1 mes calendario, renovándose automáticamente.</p>
      <p><strong>9.2.</strong> Cualquiera de las partes podrá poner término con aviso escrito de 5 días hábiles.</p>
      <p><strong>9.3.</strong> El Cliente podrá solicitar pausa del servicio por escrito.</p>

      <h2>10. Confidencialidad y datos</h2>
      <p>Las partes se obligan a mantener confidencialidad sobre información sensible, métricas y credenciales.</p>

      <h2>11. Limitación de responsabilidad</h2>
      <p>Kumera no será responsable por cambios de políticas de Google, suspensiones atribuibles al Cliente, fallas de plataformas externas o pérdidas indirectas. La responsabilidad máxima se limita al monto pagado por el Cliente en el mes correspondiente.</p>

      <h2>12. Comunicaciones</h2>
      <p>Las comunicaciones formales se realizarán por correo electrónico a las direcciones indicadas en la cláusula 1.</p>

      <h2>13. Resolución de controversias y ley aplicable</h2>
      <p>Este acuerdo se rige por las leyes de la República de Chile. Las partes podrán someter controversias a los tribunales ordinarios de justicia de Concepción.</p>

      <h2>14. Firma</h2>
      <p>En señal de aceptación, las partes firman en dos ejemplares (o mediante firma electrónica simple).</p>

      <div class="sig-grid">
        <div>
          <div class="sig-box"></div>
          <p><strong>Por el Cliente</strong><br />
          Nombre: {{company_legal_name}}<br />
          RUT: {{company_rut}}<br />
          Firma: ________________________</p>
        </div>
        <div>
          <div class="sig-box"></div>
          <p><strong>Por Kumera</strong><br />
          SERVICIOS DIGITALES KUMERA SpA<br />
          RUT: 78.299.262-7<br />
          Representante: Javier Nicolás Figueroa Aguayo<br />
          RUT: 16.370.698-9<br />
          Firma: ________________________</p>
        </div>
      </div>

      <p class="muted">ID suscripción: {{subscription_id}} · Fecha: {{generated_date}}</p>
    </main>
  </body>
</html>$$
from tractiva s
where t.service_id = s.id
  and t.target_customer_type in ('company', 'any')
  and t.status = 'active';

with tractiva as (
  select id
  from billing.services
  where slug = 'tractiva'
  limit 1
)
update billing.contract_templates t
set
  name = 'Acuerdo de Prestación de Servicios Google Ads Tractiva.cl (Persona Natural)',
  version = 'v2',
  html_template =
$$<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Acuerdo de Prestación de Servicios Google Ads Tractiva.cl</title>
    <style>
      body { margin: 0; padding: 28px; font-family: Arial, sans-serif; color: #0f172a; line-height: 1.5; }
      .wrap { max-width: 920px; margin: 0 auto; }
      h1 { margin: 0 0 10px; font-size: 26px; line-height: 1.25; }
      h2 { margin: 18px 0 8px; font-size: 18px; }
      p { margin: 0 0 8px; }
      ul { margin: 0 0 10px 18px; padding: 0; }
      li { margin: 3px 0; }
      .sig-grid { margin-top: 26px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
      .sig-box { border-top: 1px solid #334155; padding-top: 8px; min-height: 68px; }
      .muted { font-size: 12px; color: #475569; }
    </style>
  </head>
  <body>
    <main class="wrap">
      <h1>ACUERDO DE PRESTACIÓN DE SERVICIOS<br />Google Ads – Tractiva.cl ({{plan_name}})</h1>

      <h2>1. Partes</h2>
      <p><strong>1.1. Prestador:</strong> SERVICIOS DIGITALES KUMERA SpA, RUT 78.299.262-7, domicilio Sta. Lucía 75 P Valdivia, Concepción, Región del Biobío, Chile, correo contacto@kumeraweb.com, representada por Javier Nicolás Figueroa Aguayo, RUT 16.370.698-9 (en adelante, “Kumera”).</p>
      <p><strong>1.2. Cliente:</strong> {{company_legal_name}}, RUT {{company_rut}}, domicilio {{company_address}}, correo {{company_email}} (en adelante, el “Cliente”).</p>

      <h2>2. Objeto</h2>
      <p>El Cliente encarga y Kumera acepta prestar servicios de administración y optimización de campañas publicitarias en Google Ads, conforme al alcance indicado en este acuerdo.</p>

      <h2>3. Alcance del servicio</h2>
      <p><strong>3.1. Administración Google Ads (mensual – {{plan_name}}):</strong></p>
      <ul>
        <li>Creación o configuración de la cuenta Google Ads (búsqueda).</li>
        <li>Estructura inicial de campañas (grupos de anuncios, palabras clave, anuncios).</li>
        <li>Implementación de extensiones.</li>
        <li>Configuración básica de medición (conversiones y eventos).</li>
        <li>Monitoreo y optimización continua (negativas, pujas, segmentación, calidad de anuncios).</li>
        <li>Reporte periódico con métricas clave y acciones realizadas.</li>
        <li>Recomendaciones estratégicas para mejorar captación.</li>
      </ul>
      <p><strong>3.2. Fuera de alcance (salvo acuerdo escrito):</strong></p>
      <ul>
        <li>Diseño o rediseño de sitio web.</li>
        <li>Gestión de campañas en otras plataformas (Meta, TikTok u otras).</li>
        <li>Producción audiovisual o diseño gráfico avanzado.</li>
        <li>Atención comercial de los prospectos del Cliente.</li>
        <li>Servicios legales o contables.</li>
      </ul>

      <h2>4. Responsabilidades del Cliente</h2>
      <ul>
        <li>Proveer información veraz y oportuna sobre sus servicios.</li>
        <li>Aprobar contenidos y estrategias dentro de plazos razonables.</li>
        <li>Mantener operativos sus medios de contacto.</li>
        <li>Pagar directamente a Google el presupuesto publicitario.</li>
        <li>Entregar accesos necesarios (cuentas, Analytics, sitio web) o autorizar su creación.</li>
      </ul>

      <h2>5. Plazos y modalidad de trabajo</h2>
      <p><strong>5.1.</strong> El servicio se presta en modalidad mensual, con ajustes continuos.</p>
      <p><strong>5.2.</strong> La optimización es iterativa; los resultados pueden variar por estacionalidad, competencia, presupuesto y otros factores externos.</p>

      <h2>6. Presupuesto publicitario y pagos a Google</h2>
      <p><strong>6.1.</strong> El presupuesto de publicidad se paga directamente a Google por el Cliente.</p>
      <p><strong>6.2.</strong> Kumera administra configuración y optimización, pero no garantiza un volumen específico de leads o ventas.</p>

      <h2>7. Propiedad y titularidad de la cuenta Google Ads</h2>
      <p><strong>7.1.</strong> La cuenta Google Ads y sus activos serán de propiedad del Cliente.</p>
      <p><strong>7.2.</strong> Si la cuenta es creada por Kumera, el Cliente será incorporado como administrador principal.</p>
      <p><strong>7.3.</strong> Al término del servicio, se entregarán accesos y respaldos razonables.</p>

      <h2>8. Valores, facturación y forma de pago</h2>
      <p><strong>8.1.</strong> Administración mensual {{plan_name}}: ${{monthly_amount_clp}} CLP + IVA.</p>
      <p><strong>8.2.</strong> El pago mensual debe realizarse por adelantado para la continuidad del servicio.</p>
      <p><strong>8.3. Forma de pago (transferencia bancaria):</strong><br />
      Nombre empresa: SERVICIOS DIGITALES KUMERA SpA<br />
      RUT: 78.299.262-7<br />
      Banco: Banco de Créditos e Inversiones<br />
      Cuenta Corriente: 70818970<br />
      Correo: contacto@kumeraweb.com</p>

      <h2>9. Vigencia, renovación y término</h2>
      <p><strong>9.1.</strong> Este acuerdo tiene duración inicial de 1 mes calendario, renovándose automáticamente.</p>
      <p><strong>9.2.</strong> Cualquiera de las partes podrá poner término con aviso escrito de 5 días hábiles.</p>
      <p><strong>9.3.</strong> El Cliente podrá solicitar pausa del servicio por escrito.</p>

      <h2>10. Confidencialidad y datos</h2>
      <p>Las partes se obligan a mantener confidencialidad sobre información sensible, métricas y credenciales.</p>

      <h2>11. Limitación de responsabilidad</h2>
      <p>Kumera no será responsable por cambios de políticas de Google, suspensiones atribuibles al Cliente, fallas de plataformas externas o pérdidas indirectas. La responsabilidad máxima se limita al monto pagado por el Cliente en el mes correspondiente.</p>

      <h2>12. Comunicaciones</h2>
      <p>Las comunicaciones formales se realizarán por correo electrónico a las direcciones indicadas en la cláusula 1.</p>

      <h2>13. Resolución de controversias y ley aplicable</h2>
      <p>Este acuerdo se rige por las leyes de la República de Chile. Las partes podrán someter controversias a los tribunales ordinarios de justicia de Concepción.</p>

      <h2>14. Firma</h2>
      <p>En señal de aceptación, las partes firman en dos ejemplares (o mediante firma electrónica simple).</p>

      <div class="sig-grid">
        <div>
          <div class="sig-box"></div>
          <p><strong>Por el Cliente</strong><br />
          Nombre: {{company_legal_name}}<br />
          RUT: {{company_rut}}<br />
          Firma: ________________________</p>
        </div>
        <div>
          <div class="sig-box"></div>
          <p><strong>Por Kumera</strong><br />
          SERVICIOS DIGITALES KUMERA SpA<br />
          RUT: 78.299.262-7<br />
          Representante: Javier Nicolás Figueroa Aguayo<br />
          RUT: 16.370.698-9<br />
          Firma: ________________________</p>
        </div>
      </div>

      <p class="muted">ID suscripción: {{subscription_id}} · Fecha: {{generated_date}}</p>
    </main>
  </body>
</html>$$
from tractiva s
where t.service_id = s.id
  and t.target_customer_type = 'person'
  and t.status = 'active';
