# Kumera Platform v2 - Ejecucion por pasos

Este directorio es la fuente de verdad operativa para levantar todo desde cero con:

1. Un solo Supabase.
2. Un solo monorepo.
3. Migracion secuencial sin Big Bang.

Orden estricto:

1. [Paso 01 - Crear Supabase y ejecutar SQL base](/Users/javiernfigueroa/Documents/code/kumera-platform/docs/bootstrap/pasos/paso-01-supabase-base.md)
2. [Paso 02 - Conectar apps en Vercel y variables](/Users/javiernfigueroa/Documents/code/kumera-platform/docs/bootstrap/pasos/paso-02-vercel-y-envs.md)
3. [Paso 03 - Seed inicial + operacion desde admin global](/Users/javiernfigueroa/Documents/code/kumera-platform/docs/bootstrap/pasos/paso-03-seed-operacion-inicial.md)
4. [Paso 04 - Pruebas de aceptacion end-to-end](/Users/javiernfigueroa/Documents/code/kumera-platform/docs/bootstrap/pasos/paso-04-pruebas-aceptacion.md)
5. [Paso 05 - Migracion controlada Tuejecutiva](/Users/javiernfigueroa/Documents/code/kumera-platform/docs/bootstrap/pasos/paso-05-migracion-tuejecutiva.md)
6. [Paso 06 - Migracion controlada LeadOS](/Users/javiernfigueroa/Documents/code/kumera-platform/docs/bootstrap/pasos/paso-06-migracion-leados.md)

Archivos SQL que se ejecutan en Supabase SQL Editor:

1. [paso-01-core-billing.sql](/Users/javiernfigueroa/Documents/code/kumera-platform/docs/bootstrap/sql/paso-01-core-billing.sql)
2. [paso-02-tuejecutiva.sql](/Users/javiernfigueroa/Documents/code/kumera-platform/docs/bootstrap/sql/paso-02-tuejecutiva.sql)
3. [paso-03-leados.sql](/Users/javiernfigueroa/Documents/code/kumera-platform/docs/bootstrap/sql/paso-03-leados.sql)
4. [paso-04-seed-minimo.sql](/Users/javiernfigueroa/Documents/code/kumera-platform/docs/bootstrap/sql/paso-04-seed-minimo.sql)
5. [paso-05-checks-post.sql](/Users/javiernfigueroa/Documents/code/kumera-platform/docs/bootstrap/sql/paso-05-checks-post.sql)

Notas:

- Si ejecutas este orden, no necesitas copiar SQL manual desde varios lugares.
- El seed deja placeholders para valores que debes reemplazar (emails, IDs, etc.).
- No hay sentencias destructivas automáticas.
