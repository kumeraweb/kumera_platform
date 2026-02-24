# Paso 05 - Migracion controlada Tuejecutiva

Objetivo:

- Dejar Tuejecutiva operando completamente en el schema `tuejecutiva`.
- Activar validacion de suscripcion en billing sin Big Bang.

## 1) Precondiciones

1. Paso 01 a Paso 04 completados.
2. Billing estable en produccion.
3. Admin global estable.

## 2) Auth y roles (manual)

1. Migrar manualmente usuarios de Tuejecutiva al Auth unificado.
2. Asignar roles en `core.user_roles` segun necesidad.
3. Verificar login usuario por usuario critico.

## 3) Variables Tuejecutiva

1. `TUEJECUTIVA_DB_SCHEMA=tuejecutiva`
2. `TUEJECUTIVA_ENFORCE_BILLING_SUBSCRIPTION=false` inicialmente.
3. `TUEJECUTIVA_SERVICE_SUBJECT_ID=<tenant-id-o-cliente>`

## 4) Alta de suscripcion canónica

1. Crear o actualizar registro en `billing.subscriptions` con:
- `service_key='tuejecutiva'`
- `service_subject_id` consistente con `TUEJECUTIVA_SERVICE_SUBJECT_ID`
- `status='active'` para habilitar acceso real

## 5) Activar enforcement

1. Cambiar `TUEJECUTIVA_ENFORCE_BILLING_SUBSCRIPTION=true`.
2. Redeploy Tuejecutiva.
3. Validar:
- con suscripcion activa entra.
- con suscripcion inactiva bloquea.

## 6) Cierre de etapa

1. Documentar fecha/hora de corte.
2. Confirmar que no quedan usuarios operando solo en sistema legacy.
3. No iniciar LeadOS hasta cerrar este paso.
