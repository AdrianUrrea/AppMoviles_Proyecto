-- =====================================================================
-- Feature: Login, registro y correo  |  Tareas 5, 7 y 9
-- Ejecutar completo en: Supabase > SQL Editor > New query > Run
-- =====================================================================

-- ---------- Tabla rol ----------
create table public.rol (
  id_rol smallint generated always as identity primary key,
  nombre text not null unique
);

insert into public.rol (nombre) values ('usuario');

-- ---------- Tabla usuario (perfil) ----------
-- Nota: "user" es palabra reservada en Postgres, por eso se llama "usuario".
-- La contrasena NO se guarda aqui: la gestiona Supabase Auth (auth.users).
create table public.usuario (
  id_user              uuid primary key references auth.users (id) on delete cascade,
  id_rol               smallint not null references public.rol (id_rol),
  nombre               text not null check (char_length(nombre) between 1 and 60),
  apellido_paterno     text not null check (char_length(apellido_paterno) between 1 and 60),
  apellido_materno     text check (apellido_materno is null or char_length(apellido_materno) between 1 and 60),
  correo               text not null unique,
  rfc                  text not null unique
                       check (rfc ~ '^[A-ZÑ&]{4}[0-9]{6}[A-Z0-9]{3}$' and rfc <> 'XAXX010101000'),
  nacimiento           date not null,
  calle                text not null,
  num_ext              text not null,
  num_int              text,
  colonia              text not null,
  cp                   text not null check (cp ~ '^[0-9]{5}$'),
  municipio            text not null,
  estado               text not null,
  acepto_privacidad_at timestamptz not null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- ---------- updated_at automatico ----------
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger usuario_set_updated_at
before update on public.usuario
for each row execute function public.set_updated_at();

-- ---------- Seguridad (RLS) ----------
alter table public.rol enable row level security;
alter table public.usuario enable row level security;

create policy "rol_select_authenticated"
  on public.rol for select to authenticated using (true);

create policy "usuario_select_own"
  on public.usuario for select to authenticated
  using (id_user = (select auth.uid()));

create policy "usuario_update_own"
  on public.usuario for update to authenticated
  using (id_user = (select auth.uid()))
  with check (id_user = (select auth.uid()));

-- Nadie crea ni borra perfiles desde la app (lo hace el trigger / Auth).
revoke insert, delete on public.usuario from anon, authenticated;

-- Solo se pueden editar campos "seguros". NO: id_rol, correo, rfc, nacimiento.
revoke update on public.usuario from anon, authenticated;
grant update (nombre, apellido_paterno, apellido_materno,
              calle, num_ext, num_int, colonia, cp, municipio, estado)
  on public.usuario to authenticated;

-- ---------- Crear el perfil al registrarse (Tarea 7) ----------
-- La app envia los datos en signUp(options.data). Como el usuario aun no
-- tiene sesion (falta confirmar el correo), el perfil lo crea este trigger.
-- IMPORTANTE: id_rol NUNCA se toma de los datos del cliente.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_nacimiento date := (m ->> 'nacimiento')::date;
begin
  if v_nacimiento is null or v_nacimiento > (current_date - interval '18 years')::date then
    raise exception 'Debes ser mayor de 18 años.';
  end if;

  if coalesce((m ->> 'acepto_privacidad')::boolean, false) is not true then
    raise exception 'Debes aceptar el aviso de privacidad.';
  end if;

  insert into public.usuario (
    id_user, id_rol, nombre, apellido_paterno, apellido_materno, correo, rfc,
    nacimiento, calle, num_ext, num_int, colonia, cp, municipio, estado,
    acepto_privacidad_at
  ) values (
    new.id,
    (select id_rol from public.rol where nombre = 'usuario'),
    trim(m ->> 'nombre'),
    trim(m ->> 'apellido_paterno'),
    nullif(trim(m ->> 'apellido_materno'), ''),
    lower(new.email),
    upper(trim(m ->> 'rfc')),
    v_nacimiento,
    trim(m ->> 'calle'),
    trim(m ->> 'num_ext'),
    nullif(trim(m ->> 'num_int'), ''),
    trim(m ->> 'colonia'),
    trim(m ->> 'cp'),
    trim(m ->> 'municipio'),
    trim(m ->> 'estado'),
    now()
  );

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------- Verificar si un RFC esta libre (mensaje claro en el formulario) ----------
-- Compromiso: permite saber si un RFC ya esta registrado. Se acepta porque la
-- spec pide el mensaje "Este RFC ya esta registrado". La restriccion UNIQUE
-- sigue siendo la garantia real contra duplicados.
create function public.rfc_disponible(p_rfc text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (
    select 1 from public.usuario where rfc = upper(trim(p_rfc))
  );
$$;

revoke all on function public.rfc_disponible(text) from public;
grant execute on function public.rfc_disponible(text) to anon, authenticated;

-- ---------- Limpieza de cuentas sin verificar tras 24 h (Tarea 9) ----------
-- Requiere pg_cron. Si falla, actívalo en: Database > Extensions > pg_cron
-- y vuelve a ejecutar solo este bloque.
create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule(
  'limpiar-cuentas-no-verificadas',
  '0 * * * *',  -- cada hora
  $$
    delete from auth.users
    where email_confirmed_at is null
      and created_at < now() - interval '24 hours'
  $$
);
