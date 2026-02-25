# Billing Centralization Plan (Kumera)

Fecha: 2026-02-25

## Objetivo operativo

Tener un flujo automatizado de onboarding:
1. Admin crea cliente + suscripción + token.
2. Cliente abre link en `clientes.kumeraweb.com`.
3. Cliente revisa contrato, acepta, sube comprobante.
4. Admin valida/rechaza pago.
5. Se activa el servicio y se genera siguiente pago.

## Separación de responsabilidades (target)

### `clientes.kumeraweb.com` (`apps/kumerabilling-web`)
Solo onboarding de cliente (sin panel administrativo interno):
- `GET /onboarding/[token]`
- aceptar contrato
- subir comprobante
- estado básico del onboarding

No debe gestionar:
- creación de clientes
- emisión/regeneración de tokens
- operación administrativa de pagos/suscripciones

### `kumera-admin` (`apps/kumera-admin`)
Panel administrativo centralizado:
- crear cliente/suscripción
- generar/regenerar/revocar token onboarding
- listar clientes y suscripciones
- revisar comprobantes
- validar/rechazar pagos
- activar/suspender/cancelar servicio
- trazabilidad/auditoría

## Estado actual encontrado

1. `kumerabilling-web` ya contiene endpoints administrativos (`/api/admin/*`) y creación onboarding (`/api/onboarding`).
2. `kumera-admin` hoy solo tiene lectura básica de suscripciones en billing y módulos más completos para LeadOS/TuEjecutiva.
3. Hay divergencia de modelo de datos:
- Migración aplicada en `supabase/migrations/20260224_000001_kumera_platform_v2_init.sql` define billing simplificado (`subscriptions` + `payments` con columnas canónicas v2).
- Código operativo de `kumerabilling-web` usa tablas/columnas del modelo V1 más amplio (`companies`, `services`, `plans`, `contracts`, `onboarding_tokens`, `payment_transfer_proofs`, etc.).

## Decisión técnica necesaria (bloqueante)

Antes de mover endpoints entre apps, se debe fijar un único contrato de datos para billing:
- Opción A: mantener modelo V1 completo y crear migraciones oficiales en `supabase/migrations`.
- Opción B: migrar `kumerabilling-web` al modelo canónico v2 simplificado.

Recomendación práctica: Opción A en corto plazo (continuidad operativa) y plan de convergencia posterior a v2.

## Roadmap propuesto

### Fase 1 (rápida, sin romper onboarding)
1. Mantener onboarding público en `kumerabilling-web`.
2. Replicar/mover endpoints administrativos de billing a `kumera-admin` bajo `/api/admin/billing/*`.
3. Agregar UI billing en `kumera-admin` (clientes, pagos, onboarding tokens, acciones).
4. Marcar como legacy el admin de `kumerabilling-web`.

### Fase 2 (endurecimiento)
1. Deshabilitar rutas admin en `kumerabilling-web` o redirigir al admin central.
2. Unificar auditoría en `core.audit_logs` + eventos de billing.
3. Notificaciones transaccionales centralizadas (pago recibido, validado, rechazado, token emitido).

### Fase 3 (convergencia de datos)
1. Cerrar brecha entre esquema real y migraciones oficiales.
2. Definir modelo canónico final de `billing` y migración de datos.
3. Ajustar adaptadores de servicios (LeadOS/TuEjecutiva) al estado de suscripción final.

## Primer sprint de implementación sugerido

1. Crear en `kumera-admin`:
- `GET /api/admin/billing/clients`
- `GET /api/admin/billing/payments`
- `POST /api/admin/billing/payments/:id/validate`
- `POST /api/admin/billing/payments/:id/reject`
- `POST /api/admin/billing/onboarding/create`
- `POST /api/admin/billing/onboarding/:id/regenerate-token`

2. Crear UI en `kumera-admin`:
- `admin/billing` dashboard operativo
- vista de pagos pendientes con acciones validar/rechazar
- vista de onboarding links activos

3. Mantener en `clientes.kumeraweb.com` solo:
- lectura por token
- contrato aceptado
- subida de comprobante

## Criterio de éxito

- El equipo opera billing solo desde `kumera-admin`.
- `clientes.kumeraweb.com` queda como portal onboarding de cliente.
- Flujo completo (token -> contrato -> comprobante -> validación -> activación) probado E2E en producción.
