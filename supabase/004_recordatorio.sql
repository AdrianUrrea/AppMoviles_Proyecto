-- =====================================================================
-- Feature: Calendario con recordatorios
-- Ejecutar completo en: Supabase > SQL Editor > New query > Run
-- =====================================================================

create table public.recordatorio (
  id_recordatorio uuid primary key default gen_random_uuid(),
  -- El dueno se asigna en el servidor: la app no puede crear recordatorios a nombre de otra persona.
  id_user         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  titulo          text not null check (char_length(btrim(titulo)) between 1 and 80),
  fecha_hora      timestamptz not null,
  created_at      timestamptz not null default now()
);

create index recordatorio_user_fecha_idx on public.recordatorio (id_user, fecha_hora);

alter table public.recordatorio enable row level security;

create policy "recordatorio_select_own"
  on public.recordatorio for select to authenticated
  using (id_user = (select auth.uid()));

-- Se rechazan fechas pasadas (con 2 minutos de tolerancia por si el reloj del telefono va adelantado).
create policy "recordatorio_insert_own"
  on public.recordatorio for insert to authenticated
  with check (
    id_user = (select auth.uid())
    and fecha_hora > now() - interval '2 minutes'
  );

create policy "recordatorio_delete_own"
  on public.recordatorio for delete to authenticated
  using (id_user = (select auth.uid()));

-- Solo se puede crear y eliminar (editar queda fuera de alcance por ahora).
revoke all on public.recordatorio from anon;
revoke update on public.recordatorio from authenticated;
