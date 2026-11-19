-- =====================================================================
-- Feature: Datos de dinero (ingresos, deducciones, cuenta para devolucion)
-- Ejecutar completo en: Supabase > SQL Editor > New query > Run
-- Requiere haber ejecutado antes 001 (usa la funcion set_updated_at).
-- =====================================================================

create table public.captura_financiera (
  id_captura uuid primary key default gen_random_uuid(),
  -- El dueno lo asigna el servidor: la app no puede guardar datos a nombre de otra persona.
  id_user    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- anual-2025 | mensual-2026-10 | cuenta
  clave      text not null check (clave ~ '^(anual-[0-9]{4}|mensual-[0-9]{4}-(0[1-9]|1[0-2])|cuenta)$'),
  datos      jsonb not null default '{}'::jsonb
             check (jsonb_typeof(datos) = 'object' and octet_length(datos::text) <= 8192),
  updated_at timestamptz not null default now(),
  unique (id_user, clave)
);

create trigger captura_financiera_set_updated_at
before update on public.captura_financiera
for each row execute function public.set_updated_at();

alter table public.captura_financiera enable row level security;

create policy "captura_select_own"
  on public.captura_financiera for select to authenticated
  using (id_user = (select auth.uid()));

create policy "captura_insert_own"
  on public.captura_financiera for insert to authenticated
  with check (id_user = (select auth.uid()));

create policy "captura_update_own"
  on public.captura_financiera for update to authenticated
  using (id_user = (select auth.uid()))
  with check (id_user = (select auth.uid()));

create policy "captura_delete_own"
  on public.captura_financiera for delete to authenticated
  using (id_user = (select auth.uid()));

revoke all on public.captura_financiera from anon;
