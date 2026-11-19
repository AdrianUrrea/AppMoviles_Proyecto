-- =====================================================================
-- Corrige un problema de 001: el RFC quedaba reservado por cuentas SIN verificar.
-- Efectos del problema: si alguien se registraba, cerraba la app y volvia a
-- intentarlo (o corregia su correo), veia "Este RFC ya esta registrado".
--
-- Nueva regla: solo un RFC de una cuenta con correo VERIFICADO cuenta como ocupado.
-- Un registro nuevo con el mismo RFC reemplaza al pendiente sin verificar.
-- Ejecutar completo en: Supabase > SQL Editor > New query > Run
-- =====================================================================

create or replace function public.rfc_disponible(p_rfc text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (
    select 1
    from public.usuario p
    join auth.users u on u.id = p.id_user
    where p.rfc = upper(trim(p_rfc))
      and u.email_confirmed_at is not null
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_nacimiento date := (m ->> 'nacimiento')::date;
  v_rfc text := upper(trim(m ->> 'rfc'));
begin
  if v_nacimiento is null or v_nacimiento > (current_date - interval '18 years')::date then
    raise exception 'Debes ser mayor de 18 años.';
  end if;

  if coalesce((m ->> 'acepto_privacidad')::boolean, false) is not true then
    raise exception 'Debes aceptar el aviso de privacidad.';
  end if;

  -- Liberar el RFC si lo tiene una cuenta pendiente (sin verificar). Borrar la
  -- cuenta elimina tambien su perfil (ON DELETE CASCADE).
  delete from auth.users u
  using public.usuario p
  where p.id_user = u.id
    and p.rfc = v_rfc
    and u.email_confirmed_at is null
    and u.id <> new.id;

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
    v_rfc,
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
