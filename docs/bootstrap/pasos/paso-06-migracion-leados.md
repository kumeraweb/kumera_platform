# Paso 06 - Migracion controlada LeadOS

Objetivo:

- Dejar LeadOS operando completamente en schema `leados`.
- Activar habilitacion por billing de forma controlada.

## 1) Precondiciones

1. Paso 05 (Tuejecutiva) cerrado.
2. Billing estable.
3. Webhook y crons validados en entorno nuevo.

## 2) Auth y roles (manual)

1. Migrar manualmente usuarios de LeadOS al Auth unificado.
2. Asignar roles en `core.user_roles`.
3. Verificar login por usuario critico.

## 3) Variables LeadOS

1. `LEADOS_DB_SCHEMA=leados`
2. `LEADOS_ENFORCE_BILLING_SUBSCRIPTION=false` inicialmente.
3. Variables de webhook y cron correctamente definidas.

## 4) Alta de suscripcion canónica

1. Crear o actualizar registro en `billing.subscriptions` con:
- `service_key='leados'`
- `service_subject_id=<client-id-o-tenant-id>`
- `status='active'`

## 5) Activar enforcement

1. Cambiar `LEADOS_ENFORCE_BILLING_SUBSCRIPTION=true`.
2. Redeploy LeadOS.
3. Validar flujo completo:
- webhook inbound,
- decision bot/human,
- recordatorios por cron,
- bloqueo si suscripcion queda inactiva.

## 6) Cierre de etapa

1. Registrar evidencia de migracion (fecha/hora/responsable).
2. Confirmar desactivacion de accesos legacy de LeadOS.
3. Actualizar documentacion operativa final en `docs/bootstrap/`.
