# Supabase Critical Notes (2026-02-25)

Este documento resume hallazgos críticos de la migración real en producción-like.

## 1) Exposed Schemas en Supabase API
Si falta esto, las apps no leen datos por REST/SSR aunque existan tablas.

Configurar en Supabase -> API -> Exposed schemas:
- `public`
- `graphql_public`
- `core`
- `billing`
- `tuejecutiva`
- `leados`

## 2) Grants + RLS: ambas capas son obligatorias
No basta con policies. Si faltan `GRANT`, aparece error tipo:
`permission denied for table leads`.

Aplicar grants mínimos por schema/tabla para `authenticated` y `service_role` según cada app.

Caso detectado en LeadOS:
- faltaba grant de `update` sobre `leados.leads` para `authenticated`.
- resultado: panel cliente no podía tomar/cerrar conversación.

## 3) LEADOS_SECRETS_KEY debe ser idéntica en 2 proyectos
Debe coincidir exactamente entre:
- `apps/kumera-admin` (cifra secretos de canal)
- `apps/leadosku-web/leados-system` (descifra en webhook)

Si no coincide:
- Webhook POST llega pero responde `500`.
- No se crean `leads` ni `messages`.

Formato esperado:
- Base64 de 32 bytes.
- Ejemplo de generación: `openssl rand -base64 32`

## 4) Webhook de WhatsApp: separación de responsabilidades
- `WHATSAPP_WEBHOOK_VERIFY_TOKEN`: solo valida `GET` de verificación de Meta.
- `meta_app_secret`: se guarda por canal en DB cifrado (`client_channels.meta_app_secret_enc`) y se usa en `POST` (firma).

No confundir variable de entorno global con secreto por canal.

## 5) Secuencia correcta para habilitar un cliente LeadOS
1. Crear cliente.
2. Asignar usuario (`user_clients`).
3. Crear canal con `phone_number_id`, `meta_access_token`, `meta_app_secret` correctos.
4. Crear flujo activo.

Si falta cualquier paso, no habrá conversación funcional end-to-end.

## 6) Flags de diagnóstico (temporales)
En `leados-system` se usaron flags para depuración:
- `WHATSAPP_SKIP_SIGNATURE_CHECK=true`
- `WHATSAPP_WEBHOOK_DEBUG=true`

Dejar en producción final:
- eliminar o dejar en `false` ambos flags.

## 7) Legacy admin deshabilitado
Estado actual:
- LeadOS `/backoffice*` y `/api/backoffice*` deshabilitados/redirigidos a `kumera-admin`.
- Tuejecutiva `/admin*` y `/api/admin*` deshabilitados/redirigidos a `kumera-admin`.

Variable recomendada en apps legacy para redirección:
- `KUMERA_ADMIN_URL`

## 8) Vercel en monorepo: evitar redeploy de todo
Por proyecto Vercel:
1. Activar "Skip deployments when there are no changes..."
2. Usar Ignored Build Step con script central:
`node scripts/vercel/ignored-build-step.mjs <app-path>`

## 9) Astro en monorepo: lockfile por app puede romper build
Problema observado: optional deps nativas no instaladas en Vercel.
Mitigación aplicada en Astro apps:
- eliminar `package-lock.json` interno de app.
- declarar optional deps nativas necesarias (ej. rollup linux).

---

## Checklist rápido post-migración
- [ ] Exposed schemas correctos.
- [ ] Grants + RLS validados por app.
- [ ] `LEADOS_SECRETS_KEY` igual en admin + leados-system.
- [ ] Webhook Meta con URL y verify token correctos.
- [ ] Canal creado nuevamente tras cualquier cambio de secrets key.
- [ ] Flags de debug apagados en producción.
- [ ] Legacy admins bloqueados y redirección a `kumera-admin`.
