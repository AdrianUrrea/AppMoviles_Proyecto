-- =====================================================================
-- Feature: Documentos (fotos de documentos)
-- Ejecutar completo en: Supabase > SQL Editor > New query > Run
-- =====================================================================

-- ---------- Almacenamiento privado ----------
-- Bucket PRIVADO: los archivos solo se ven con enlaces temporales firmados.
-- Limite de 5 MB y solo JPEG (la app comprime todo a JPEG antes de subir).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documentos', 'documentos', false, 5242880, array['image/jpeg'])
on conflict (id) do nothing;

-- Cada usuario solo accede a SU carpeta: documentos/<id del usuario>/...
create policy "documentos_storage_select_own"
  on storage.objects for select to authenticated
  using (bucket_id = 'documentos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "documentos_storage_insert_own"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'documentos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "documentos_storage_delete_own"
  on storage.objects for delete to authenticated
  using (bucket_id = 'documentos' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ---------- Tabla documento ----------
create table public.documento (
  id_documento  uuid primary key default gen_random_uuid(),
  -- El dueno lo asigna el servidor: la app no puede crear documentos a nombre de otra persona.
  id_user       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nombre        text not null check (char_length(btrim(nombre)) between 1 and 80),
  ruta_archivo  text not null unique,
  tipo_mime     text not null default 'image/jpeg',
  tamano_bytes  integer not null check (tamano_bytes > 0 and tamano_bytes <= 5242880),
  created_at    timestamptz not null default now(),
  -- El archivo debe estar dentro de la carpeta del propio usuario.
  check (ruta_archivo like id_user::text || '/%')
);

create index documento_user_fecha_idx on public.documento (id_user, created_at desc);

alter table public.documento enable row level security;

create policy "documento_select_own"
  on public.documento for select to authenticated
  using (id_user = (select auth.uid()));

create policy "documento_insert_own"
  on public.documento for insert to authenticated
  with check (id_user = (select auth.uid()));

create policy "documento_delete_own"
  on public.documento for delete to authenticated
  using (id_user = (select auth.uid()));

-- Por ahora solo se crea y se elimina (renombrar queda fuera de alcance).
revoke all on public.documento from anon;
revoke update on public.documento from authenticated;
