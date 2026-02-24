# Paso 03 - Seed inicial + operacion desde admin global

Objetivo:

- Crear estado minimo para operar desde cero.
- Empezar a repoblar datos desde panel admin global y paneles de producto.

## 1) Ejecutar seed SQL minimo

1. Abre SQL Editor de Supabase.
2. Ejecuta [paso-04-seed-minimo.sql](/Users/javiernfigueroa/Documents/code/kumera-platform/docs/bootstrap/sql/paso-04-seed-minimo.sql)

Este seed:

1. Inserta servicios base en `billing.services`.
2. Inserta planes base en `billing.plans`.
3. Deja consulta helper para asignar `superadmin` en `core.user_roles`.

## 2) Crear usuarios admin (manual, obligatorio)

1. Crea usuario admin en Supabase Auth (Dashboard).
2. Ejecuta el bloque SQL indicado en seed para asignar:
- `superadmin`
- `admin_billing`
- opcional `admin_tuejecutiva`
- opcional `admin_leados`

## 3) Levantar operacion base desde paneles

## Desde `apps/kumera-admin`

1. Validar login admin.
2. Ver modulo de roles.
3. Ver modulo de subscriptions.

## Desde `apps/kumerabilling-web`

1. Crear empresa.
2. Crear suscripcion por servicio (`service_key`).
3. Crear pagos y estado inicial.

## Desde Tuejecutiva

1. Crear ejecutivas de prueba.
2. Crear o revisar onboarding.

## Desde LeadOS

1. Crear cliente de prueba.
2. Crear canal WhatsApp de prueba.
3. Crear flujo inicial.

## 4) Regla operacional clave

`billing.subscriptions` es la unica fuente de verdad para habilitacion.

- Servicio activo: acceso habilitado.
- Servicio suspendido/cancelado: acceso bloqueado cuando actives enforcement.
