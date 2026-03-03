-- Paso 02b
-- Tuejecutiva storage buckets + policies
--
-- Requerido para:
-- - Fotos ejecutivas (bucket: executive-photos)
-- - Logos empresas (bucket: company-logos)
-- - Documentos onboarding privados (bucket: onboarding-documents)

-- 1) Buckets idempotentes
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'executive-photos',
    'executive-photos',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'company-logos',
    'company-logos',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
  ),
  (
    'onboarding-documents',
    'onboarding-documents',
    false,
    10485760,
    array[
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 2) Policies de lectura publica (solo assets publicos)
drop policy if exists public_read_executive_photos on storage.objects;
create policy public_read_executive_photos
on storage.objects
for select
to public
using (bucket_id = 'executive-photos');

drop policy if exists public_read_company_logos on storage.objects;
create policy public_read_company_logos
on storage.objects
for select
to public
using (bucket_id = 'company-logos');

-- 3) Policies para service_role (backend only)
drop policy if exists service_role_manage_executive_photos on storage.objects;
create policy service_role_manage_executive_photos
on storage.objects
for all
to service_role
using (bucket_id = 'executive-photos' and auth.role() = 'service_role')
with check (bucket_id = 'executive-photos' and auth.role() = 'service_role');

drop policy if exists service_role_manage_company_logos on storage.objects;
create policy service_role_manage_company_logos
on storage.objects
for all
to service_role
using (bucket_id = 'company-logos' and auth.role() = 'service_role')
with check (bucket_id = 'company-logos' and auth.role() = 'service_role');

drop policy if exists service_role_manage_onboarding_documents on storage.objects;
create policy service_role_manage_onboarding_documents
on storage.objects
for all
to service_role
using (bucket_id = 'onboarding-documents' and auth.role() = 'service_role')
with check (bucket_id = 'onboarding-documents' and auth.role() = 'service_role');

