-- Billing: normalize templates with pre-signed Kumera block (idempotent update)

update billing.contract_templates
set html_template =
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
      .muted { font-size: 12px; color: #475569; }
      .sig-grid { margin-top: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
      .sig-box { border-top: 1px solid #334155; padding-top: 8px; min-height: 60px; }
    </style>
  </head>
  <body>
    <main class="wrap">
      <h1>Acuerdo de Prestación de Servicios</h1>
      <p>Servicio: {{service_name}} · Plan: {{plan_name}} · Fecha: {{generated_date}}</p>

      <h2>Partes</h2>
      <div class="box">
        <p><strong>Prestador:</strong> Servicios Digitales Kumera Spa, RUT 78.299.262-7.</p>
        <p><strong>Cliente:</strong> {{company_legal_name}}, RUT {{company_rut}}, domicilio {{company_address}}, correo {{company_email}}, teléfono {{company_phone}}.</p>
        <p><strong>Representante legal (si aplica):</strong> {{legal_representative_name}} · RUT {{legal_representative_rut}}</p>
      </div>

      <h2>Honorarios</h2>
      <p>Monto mensual del plan contratado: <strong>${{monthly_amount_clp}} CLP + IVA</strong>.</p>

      <h2>Vigencia</h2>
      <p>Acuerdo de vigencia mensual con renovación automática mientras la suscripción permanezca activa.</p>

      <div class="sig-grid">
        <div>
          <div class="sig-box"></div>
          <p class="muted"><strong>Firmado por Kumera (prefirmado)</strong><br />
          Javier Nicolás Figueroa Aguayo<br />
          Representante Legal<br />
          Servicios Digitales Kumera Spa<br />
          RUT 78.299.262-7<br />
          Fecha firma Kumera: {{kumera_signed_date}}</p>
        </div>
        <div>
          <div class="sig-box"></div>
          <p class="muted"><strong>Firma del cliente</strong><br />
          Nombre: {{company_legal_name}}<br />
          RUT: {{company_rut}}<br />
          Fecha aceptación cliente: {{generated_date}}</p>
        </div>
      </div>

      <p class="muted">ID suscripción: {{subscription_id}} · Tipo documento tributario: {{tax_document_type}}</p>
    </main>
  </body>
</html>$$
where status = 'active'
  and target_customer_type in ('company', 'any')
  and name in (
    'Acuerdo Servicio Google Ads',
    'Acuerdo Servicio TuEjecutiva',
    'Acuerdo Servicio LeadOS'
  );

update billing.contract_templates
set html_template =
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
      .muted { font-size: 12px; color: #475569; }
      .sig-grid { margin-top: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
      .sig-box { border-top: 1px solid #334155; padding-top: 8px; min-height: 60px; }
    </style>
  </head>
  <body>
    <main class="wrap">
      <h1>Acuerdo de Prestación de Servicios</h1>
      <p>Servicio: {{service_name}} · Plan: {{plan_name}} · Fecha: {{generated_date}}</p>

      <h2>Partes</h2>
      <div class="box">
        <p><strong>Prestador:</strong> Servicios Digitales Kumera Spa, RUT 78.299.262-7.</p>
        <p><strong>Cliente persona natural:</strong> {{company_legal_name}}, RUT {{company_rut}}, domicilio {{company_address}}, correo {{company_email}}, teléfono {{company_phone}}.</p>
      </div>

      <h2>Honorarios</h2>
      <p>Monto mensual del plan contratado: <strong>${{monthly_amount_clp}} CLP + IVA</strong>.</p>

      <div class="sig-grid">
        <div>
          <div class="sig-box"></div>
          <p class="muted"><strong>Firmado por Kumera (prefirmado)</strong><br />
          Javier Nicolás Figueroa Aguayo<br />
          Representante Legal<br />
          Servicios Digitales Kumera Spa<br />
          RUT 78.299.262-7<br />
          Fecha firma Kumera: {{kumera_signed_date}}</p>
        </div>
        <div>
          <div class="sig-box"></div>
          <p class="muted"><strong>Firma del cliente</strong><br />
          Nombre: {{company_legal_name}}<br />
          RUT: {{company_rut}}<br />
          Fecha aceptación cliente: {{generated_date}}</p>
        </div>
      </div>

      <p class="muted">ID suscripción: {{subscription_id}}</p>
    </main>
  </body>
</html>$$
where status = 'active'
  and target_customer_type = 'person'
  and name in (
    'Acuerdo Servicio Google Ads Persona Natural',
    'Acuerdo Servicio TuEjecutiva Persona Natural',
    'Acuerdo Servicio LeadOS Persona Natural'
  );
