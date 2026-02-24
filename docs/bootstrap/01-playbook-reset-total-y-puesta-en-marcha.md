# Playbook: reset total de Supabase + puesta en marcha + repoblación

Este runbook asume que vas a:
- borrar las BDs actuales,
- levantar un **Supabase único nuevo**,
- reconectar apps del monorepo,
- repoblar operación con paneles administrativos.

## Resultado esperado

Al final debes tener:
1. Un Supabase nuevo con schemas `core`, `billing`, `tuejecutiva`, `leados`.
2. `kumerabilling-web` funcionando contra `billing`.
3. `kumera-admin` operando roles y suscripciones.
4. Tuejecutiva y LeadOS funcionales en modo migración controlada.
5. Camino claro para mover Tuejecutiva y LeadOS a schemas dedicados sin Big Bang.

## Fase A — Preparación segura

1. Respaldar antes de borrar.
- Exporta datos mínimos históricos que quieras conservar (usuarios, clientes, suscripciones, leads críticos).
- Guarda respaldo fuera del repo.

2. Congelar cambios de producto.
- Evita deploys nuevos mientras ejecutas este playbook.

3. Definir proyecto Supabase nuevo.
- Crear proyecto desde dashboard de Supabase.
- Guardar:
  - `Project URL`
  - `anon key`
  - `service_role key`

## Fase B — Inicializar nueva base

1. Abrir SQL Editor en Supabase nuevo.
2. Ejecutar el archivo:
- `supabase/migrations/20260224_000001_kumera_platform_v2_init.sql`

3. Verificar creación de schemas.
- Deben existir: `core`, `billing`, `tuejecutiva`, `leados`.

4. Verificar tablas mínimas.
- `core.user_roles`
- `core.audit_logs`
- `billing.subscriptions`
- `billing.payments`
- `tuejecutiva.service_tenants`
- `leados.service_tenants`

5. Verificar RLS.
- RLS habilitado en todas las tablas anteriores.

## Fase C — Conectar proyectos a Vercel (orden estricto)

## C1) Proyecto Billing (`apps/kumerabilling-web`)

1. Crear proyecto en Vercel.
- Root Directory: `apps/kumerabilling-web`

2. Configurar variables de entorno (ver documento de variables):
- `NEXT_PUBLIC_APP_URL`
- `SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `APP_CRON_SECRET` (y opcional `CRON_SECRET`)
- variables de correo

3. Deploy a producción.

4. Prueba funcional mínima.
- endpoint admin dashboard responde,
- rutas onboarding/pagos responden.

## C2) Proyecto Admin Global (`apps/kumera-admin`)

1. Crear proyecto en Vercel.
- Root Directory: `apps/kumera-admin`

2. Variables:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- opcional `NEXT_PUBLIC_SUPABASE_URL`

3. Deploy.

4. Prueba mínima.
- `/admin/roles` carga.
- `/admin/subscriptions` carga.

## C3) Proyecto Tuejecutiva (`apps/tuejecutiva-web`)

1. Crear/actualizar proyecto en Vercel.
- Root Directory: `apps/tuejecutiva-web`

2. Variables iniciales (modo controlado):
- `TUEJECUTIVA_DB_SCHEMA=public`
- `TUEJECUTIVA_ENFORCE_BILLING_SUBSCRIPTION=false`
- resto de variables Supabase

3. Deploy.

4. Validar front y panel admin existente.

## C4) Proyecto LeadOS (`apps/leadosku-web/leados-system`)

1. Crear/actualizar proyecto en Vercel.
- Root Directory: `apps/leadosku-web/leados-system`

2. Variables iniciales (modo controlado):
- `LEADOS_DB_SCHEMA=public`
- `LEADOS_ENFORCE_BILLING_SUBSCRIPTION=false`
- resto de variables obligatorias (Meta, secretos, cron)

3. Deploy.

4. Validar login backoffice/panel + webhook health.

## C5) Sitios Astro (sin migración de stack)

1. `apps/kumera-web` a su proyecto Vercel.
2. `apps/tractiva-web` a su proyecto Vercel.
3. Configurar solo envs que realmente usan.

## Fase D — Repoblación inicial de operación

Objetivo: reconstruir estado mínimo desde administración, con control manual.

## D1) Crear roles globales en `core.user_roles`

1. Crear usuario admin principal en Supabase Auth.
2. Insertar rol `superadmin` en `core.user_roles` para ese usuario.
3. Crear usuarios operativos y asignar roles básicos:
- `admin_billing`
- `admin_tuejecutiva`
- `admin_leados`

## D2) Cargar catálogo/estado de billing (fuente de verdad)

Desde `kumera-admin` o API de billing:
1. Crear registros de `billing.subscriptions` para servicios activos.
2. Definir por cada suscripción:
- `service_key` (`tuejecutiva`, `leados`, etc.)
- `service_subject_id` (id lógico del tenant/cliente)
- `status` (`trial` o `active`)
- `plan_code`

3. Validar que aparezcan en `/admin/subscriptions`.

## D3) Repoblar Tuejecutiva

Inicialmente puedes operar con el panel admin propio de Tuejecutiva.

1. Crear usuarias/ejecutivas en Tuejecutiva.
2. Crear tokens y submissions de onboarding de prueba.
3. Verificar render en frontend público.

## D4) Repoblar LeadOS

Inicialmente puedes operar con el backoffice de LeadOS.

1. Crear cliente LeadOS (`clients`).
2. Crear canal WhatsApp (`client_channels`) con secretos cifrados.
3. Asignar usuarios a tenant (`user_clients`).
4. Crear flow inicial (`client_flows`, `flow_steps`, `flow_step_options`).

## Fase E — Pruebas end-to-end obligatorias

1. Billing:
- Crear/actualizar suscripción y verificar persistencia.

2. Tuejecutiva:
- Login admin,
- crear ejecutiva,
- visualización pública.

3. LeadOS:
- login backoffice,
- crear cliente + flujo,
- simular inbound webhook y validar lead.

4. Seguridad:
- usuario sin rol no debe acceder a módulos admin.
- secretos backend no expuestos al cliente.

## Fase F — Activar migración por schema (cuando confirmes estabilidad)

**No hacerlo el mismo día del reset inicial.**

1. Migrar Tuejecutiva a schema dedicado.
- mover datos a `tuejecutiva`.
- cambiar `TUEJECUTIVA_DB_SCHEMA=tuejecutiva`.
- test completo.

2. Activar enforcement de billing en Tuejecutiva.
- `TUEJECUTIVA_ENFORCE_BILLING_SUBSCRIPTION=true`.
- test acceso con suscripción activa/inactiva.

3. Migrar LeadOS a schema dedicado.
- mover datos a `leados`.
- cambiar `LEADOS_DB_SCHEMA=leados`.

4. Activar enforcement de billing en LeadOS.
- `LEADOS_ENFORCE_BILLING_SUBSCRIPTION=true`.

## Fase G — Checklist de cierre

- [ ] Supabase único operativo
- [ ] Billing como fuente de verdad activa
- [ ] Admin global operativo
- [ ] Tuejecutiva y LeadOS funcionando
- [ ] Crons configurados con `APP_CRON_SECRET`
- [ ] Documentación en `docs/` actualizada
- [ ] Variables de entorno guardadas en Vercel por entorno

## Troubleshooting rápido

1. Error de RLS inesperado.
- Verificar rol del usuario en `core.user_roles`.
- Verificar que operación sensible se ejecute server-side con `service_role`.

2. App no conecta a Supabase.
- Revisar coincidencia de URL/keys entre variables públicas y privadas.

3. Acceso bloqueado por suscripción.
- Revisar `billing.subscriptions` por `service_key` + `service_subject_id`.
- Si estás en etapa inicial, confirmar flag `*_ENFORCE_BILLING_SUBSCRIPTION=false`.
