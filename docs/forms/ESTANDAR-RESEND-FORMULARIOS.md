# Estandar Resend para Formularios Web (Kumera Platform)

Fecha: 2026-02-25

## Objetivo
Todos los formularios de contacto de sitios públicos deben:

1. Enviar alerta interna a `contacto@kumeraweb.com`.
2. Enviar auto-respuesta al usuario con branding del sitio (Tractiva, TuEjecutiva, etc.).
3. Usar una sola cuenta Resend con dominio verificado `kumeraweb.com`.

## Variables de entorno estandar (todas las webs)

Variables obligatorias:

1. `RESEND_API_KEY`

Variables recomendadas (estandarizadas):

1. `CONTACT_INBOX_EMAIL` (default en código: `contacto@kumeraweb.com`)
2. `CONTACT_FROM_EMAIL` (default en código por proyecto)

## Configuracion recomendada por proyecto

### apps/tractiva-web

1. `RESEND_API_KEY=<tu_resend_key>`
2. `CONTACT_INBOX_EMAIL=contacto@kumeraweb.com`
3. `CONTACT_FROM_EMAIL=Tractiva.cl <contacto@kumeraweb.com>`
4. `ALLOWED_ORIGINS=https://tractiva.cl,https://www.tractiva.cl,https://kumera-platform-tractiva-web.vercel.app`

### apps/tuejecutiva-web

1. `RESEND_API_KEY=<tu_resend_key>`
2. `CONTACT_INBOX_EMAIL=contacto@kumeraweb.com`
3. `CONTACT_FROM_EMAIL=TuEjecutiva.cl <contacto@kumeraweb.com>`

## Comportamiento esperado

1. Si falla el email interno a inbox -> endpoint responde error (porque se perdería lead).
2. Si falla solo el auto-reply al usuario -> endpoint responde OK y registra log de warning.
3. Nunca usar remitentes de dominios no verificados en Resend.

## Checklist de validacion rapida

1. Enviar formulario desde Tractiva:
   - Debe llegar correo interno a `contacto@kumeraweb.com`.
   - Debe llegar auto-reply con firma Tractiva.
2. Enviar formulario desde TuEjecutiva:
   - Debe llegar correo interno a `contacto@kumeraweb.com`.
   - Debe llegar auto-reply con firma TuEjecutiva.
3. Revisar logs de Vercel:
   - Sin `Missing RESEND_API_KEY`.
   - Sin rechazo de sender/domain de Resend.
