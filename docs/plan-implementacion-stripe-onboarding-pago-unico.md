# Plan de implementación: Stripe pago único en onboarding

## 1) Objetivo
Incorporar un segundo medio de pago (Stripe) en el onboarding actual, manteniendo transferencia bancaria como fallback.

Resultado esperado:
- El cliente recibe link de onboarding.
- Firma contrato.
- Elige método de pago:
  - Transferencia (flujo actual).
  - Tarjeta vía Stripe (nuevo).
- Si paga por Stripe, el pago queda validado automáticamente por webhook.
- No se implementa cobro recurrente automático.

---

## 2) Alcance (MVP)
Incluye:
- Pago único por Stripe Checkout (hosted).
- Confirmación por webhook (`checkout.session.completed`).
- Actualización de estado en `billing.payments` y `billing.subscriptions`.
- UI en onboarding para elegir método.

No incluye:
- Suscripciones recurrentes.
- Reintentos automáticos de cobro.
- Gestión avanzada de reembolsos.

---

## 3) Cambios de base de datos

## 3.1 Tabla `billing.payments`
Agregar columnas para pasarela:

```sql
alter table billing.payments
  add column if not exists gateway text null,
  add column if not exists gateway_payment_id text null,
  add column if not exists gateway_status text null,
  add column if not exists paid_at timestamptz null,
  add column if not exists payment_url text null;

create index if not exists idx_billing_payments_gateway_payment_id
  on billing.payments(gateway_payment_id);
```

Campos sugeridos:
- `gateway`: `stripe` o `null`.
- `gateway_payment_id`: id de sesión o payment intent Stripe.
- `gateway_status`: estado reportado por Stripe.
- `paid_at`: fecha de pago confirmado.
- `payment_url`: opcional para guardar URL de checkout generada.

## 3.2 Auditoría (opcional recomendado)
Registrar eventos en `billing.onboarding_events` y/o `billing.audit_logs`:
- `payment.stripe.checkout_created`
- `payment.stripe.completed`
- `payment.stripe.failed`

---

## 4) Implementación de código

## 4.1 Proyecto `apps/kumerabilling-web`

### A) Endpoint crear checkout
Crear:
- `POST /api/payments/[paymentId]/stripe-checkout`

Responsabilidades:
1. Validar token onboarding/payment-link.
2. Verificar que el `paymentId` pertenece a la suscripción del token.
3. Verificar que estado del pago sea `pending`.
4. Crear `Stripe Checkout Session` (modo `payment`).
5. Guardar `gateway='stripe'`, `gateway_payment_id`, `gateway_status='checkout_created'`, `payment_url`.
6. Retornar URL de checkout para redirigir.

### B) Webhook Stripe
Crear:
- `POST /api/webhooks/stripe`

Responsabilidades:
1. Verificar firma del webhook con `STRIPE_WEBHOOK_SECRET`.
2. Procesar al menos `checkout.session.completed`.
3. Localizar pago por `gateway_payment_id` (o metadata `payment_id`).
4. Marcar pago:
   - `status='validated'`
   - `gateway_status='completed'`
   - `paid_at=now()`
5. Actualizar suscripción a `active` si corresponde.
6. Idempotencia: no reprocesar pagos ya validados.

### C) UI onboarding
Archivo actual principal:
- `apps/kumerabilling-web/src/app/onboarding/[token]/page.tsx`

Cambios:
1. Mantener selector método de pago.
2. Si método Stripe:
   - Botón `Pagar con tarjeta`.
   - Llamar a endpoint checkout y redirigir.
3. Si transferencia:
   - Mantener `TransferProofForm` como hoy.
4. Si pago ya validado (Stripe), ocultar bloque de comprobante y mostrar estado pagado.

### D) Seguridad
- Rate limit en endpoint checkout y webhook.
- Validación estricta de token/scope.
- No exponer secret keys en frontend.

---

## 4.2 Proyecto `apps/kumera-admin`

Cambios en UI Billing:
- En tabla de pagos, mostrar badge de método (`bank_transfer` / `stripe`).
- Si pago fue Stripe validado, mostrar `Validado automáticamente`.
- Mantener botón manual `Validar` para transferencia.

Cambios API admin (opcional):
- Endpoint para regenerar link onboarding/payment sigue igual.
- No requiere endpoint admin extra para Stripe en MVP si todo ocurre desde onboarding cliente.

---

## 5) Variables de entorno necesarias

## 5.1 `apps/kumerabilling-web` (Vercel)
Obligatorias:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_APP_URL` (ej: `https://clientes.kumeraweb.com`)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Opcional:
- `STRIPE_API_VERSION` (si quieres fijar versión)

## 5.2 `apps/kumera-admin`
No necesita Stripe para este MVP (si checkout se crea en onboarding web).
Mantener variables actuales de Supabase/admin.

---

## 6) Instructivo simple: Stripe.com

1. Crear cuenta en Stripe y completar activación de negocio.
2. Ir a Developers > API keys y copiar:
- Secret key (`sk_...`) -> `STRIPE_SECRET_KEY`.
3. Ir a Developers > Webhooks > Add endpoint:
- URL: `https://clientes.kumeraweb.com/api/webhooks/stripe`
- Eventos:
  - `checkout.session.completed`
  - (opcional) `checkout.session.expired`, `payment_intent.payment_failed`
4. Copiar `Signing secret` (`whsec_...`) -> `STRIPE_WEBHOOK_SECRET`.
5. En modo test, hacer pago de prueba con tarjeta test Stripe.
6. Verificar que webhook marque pago `validated` en Supabase.
7. Cuando todo esté OK, repetir configuración en modo live.

---

## 7) Flujo técnico final (resumen)
1. Cliente abre onboarding con token.
2. Firma contrato.
3. Elige Stripe.
4. Backend crea Checkout Session y redirige.
5. Stripe confirma pago y dispara webhook.
6. Webhook valida firma y actualiza BD.
7. Cliente vuelve a pantalla de éxito.
8. Admin ve pago validado automáticamente.

---

## 8) Checklist de pruebas

Pruebas funcionales:
1. Pago Stripe exitoso actualiza `payments.status='validated'`.
2. Transferencia sigue funcionando sin regresiones.
3. Token inválido no permite crear checkout.
4. Repetir webhook no duplica ni rompe estado.
5. UI onboarding refleja correctamente pago ya confirmado.

Pruebas de seguridad:
1. Webhook con firma inválida debe rechazar.
2. Endpoint checkout sin token válido debe rechazar.
3. No exponer `STRIPE_SECRET_KEY` en cliente.

---

## 9) Riesgos y mitigación
- Webhook no llega: registrar logs y permitir reenvío desde Stripe Dashboard.
- Pago confirmado pero timeout frontend: confiar en webhook como fuente de verdad.
- Doble procesamiento: idempotencia por `gateway_payment_id` + `status`.

---

## 10) Orden de implementación recomendado
1. Migración SQL de `billing.payments`.
2. Endpoint `stripe-checkout`.
3. Endpoint `webhooks/stripe`.
4. UI onboarding método Stripe.
5. Ajustes visuales/admin.
6. Pruebas test mode.
7. Deploy producción + webhook live.
