# Paso 01 - Crear Supabase y ejecutar SQL base

Objetivo:

- Crear el nuevo proyecto Supabase unificado.
- Crear schemas `core`, `billing`, `tuejecutiva`, `leados`.
- Dejar RLS habilitado en tablas de negocio.

## 1) Crear proyecto Supabase nuevo

1. En Supabase, crea un proyecto nuevo (no reutilizar proyectos legacy).
2. Guarda estos valores:
- `Project URL`
- `anon key`
- `service_role key`

## 2) Abrir SQL Editor y ejecutar en este orden

1. Ejecutar [paso-01-core-billing.sql](/Users/javiernfigueroa/Documents/code/kumera-platform/docs/bootstrap/sql/paso-01-core-billing.sql)
2. Ejecutar [paso-02-tuejecutiva.sql](/Users/javiernfigueroa/Documents/code/kumera-platform/docs/bootstrap/sql/paso-02-tuejecutiva.sql)
3. Ejecutar [paso-02b-tuejecutiva-storage.sql](/Users/javiernfigueroa/Documents/code/kumera-platform/docs/bootstrap/sql/paso-02b-tuejecutiva-storage.sql)
4. Ejecutar [paso-03-leados.sql](/Users/javiernfigueroa/Documents/code/kumera-platform/docs/bootstrap/sql/paso-03-leados.sql)

## 3) Validaciones rapidas

1. Confirmar schemas:
- `core`
- `billing`
- `tuejecutiva`
- `leados`

2. Confirmar tablas criticas:
- `core.user_roles`
- `billing.subscriptions`
- `tuejecutiva.executives`
- `leados.clients`

3. Confirmar buckets Tuejecutiva:
- `executive-photos`
- `company-logos`
- `onboarding-documents`

3. Confirmar RLS:
- RLS activo en tablas de negocio (no solo en `public`).

## 4) Restricciones obligatorias

1. No crear tablas de negocio en `public`.
2. No usar `service_role` desde frontend/browser.
3. No ejecutar scripts de borrado masivo.
