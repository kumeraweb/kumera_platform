# Paso 04 - Pruebas de aceptacion end-to-end

Objetivo:

- Confirmar que toda la plataforma funciona en el nuevo Supabase.

## 1) Ejecutar checks SQL

1. En SQL Editor, ejecutar [paso-05-checks-post.sql](/Users/javiernfigueroa/Documents/code/kumera-platform/docs/bootstrap/sql/paso-05-checks-post.sql)
2. Revisar que no haya tablas de negocio en `public`.
3. Revisar RLS habilitado en tablas de negocio.

## 2) Pruebas funcionales minimas

## Billing

1. Crear o editar suscripcion.
2. Confirmar persistencia en `billing.subscriptions`.

## Tuejecutiva

1. Crear ejecutiva desde panel.
2. Verificar que se visualiza en frontend (si estado lo permite).

## LeadOS

1. Crear cliente y flujo.
2. Simular evento inbound en webhook.
3. Verificar creacion/actualizacion de lead.

## 3) Pruebas de seguridad

1. Usuario sin rol admin no accede a rutas admin.
2. Variables `service_role` no expuestas al cliente.
3. No hay acceso cross-tenant indebido en LeadOS.

## 4) Criterio de salida

Solo pasar al Paso 05 cuando:

1. Billing estable.
2. Admin global estable.
3. Pruebas basicas de Tuejecutiva y LeadOS en verde.
