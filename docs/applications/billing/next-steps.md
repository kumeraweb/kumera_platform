# Billing MVP: siguientes pasos

## Lo que queda implementado ahora (MVP)
- Semáforo visual en `Próximo cobro` dentro de `admin/billing`:
  - rojo: vencido
  - amarillo: vence dentro de 7 días
  - normal: más de 7 días
- Botón `Generar link de pago` por suscripción en `admin/billing`.
- Link público de pago en `clientes.kumeraweb.com/pago/{token}` para cargar comprobante.
- Token de pago de un solo uso (`billing.payment_access_tokens`) con expiración y revocación.

## Fase 2 (recomendado)
1. Envío automático por correo del link de pago (Resend), con plantilla branded.
2. Recordatorios automáticos de cobro:
- D-5, D-2 y D+1 si sigue pendiente.
3. Estados de cobranza más explícitos:
- `due_soon`, `overdue_7`, `overdue_15`, `overdue_30`.
4. Historial de links de pago generados por suscripción:
- quién lo generó, cuándo expira, si fue consumido.

## Fase 3 (automatización real)
1. Generación automática del pago mensual por cron (si no existe).
2. Link de pago auto-generado al crear cada pago mensual.
3. Dashboard de cobranza con KPIs:
- pendientes hoy
- vencidos
- recaudado mes actual
- tasa de validación
4. Export CSV para conciliación contable.

## Fase 4 (pasarelas externas)
1. Integrar Webpay/Stripe como segundo método.
2. Webhook seguro de confirmación de pago.
3. Mantener transferencia como fallback.
4. Hacer switch de método por servicio o por cliente.

## Hardening pendiente (seguridad)
1. Rate-limit adicional por token y por IP en endpoints de firma y pago.
2. Bloqueo progresivo tras múltiples intentos fallidos.
3. Auditoría extendida (IP, UA, latencia, motivo de rechazo).
4. CSP revisada sin scripts inline en todas las rutas públicas.

## QA sugerido antes de cerrar esta etapa
1. Crear onboarding, firmar, subir comprobante, validar pago.
2. Desde admin generar link de pago mensual y completar flujo en `/pago/{token}`.
3. Confirmar que el token de pago ya usado no vuelva a permitir carga.
4. Verificar que el semáforo de fechas refleja correctamente vencidos y próximos.
