-- =====================================================================
-- Decision de producto: en "Mi perfil" el usuario solo puede editar su DOMICILIO
-- (y su contrasena, que la gestiona Supabase Auth, no esta tabla).
-- 001 permitia editar tambien nombre y apellidos; esto lo restringe en la base de datos,
-- que es la garantia real (la app por si sola no basta).
-- Ejecutar completo en: Supabase > SQL Editor > New query > Run
-- =====================================================================

revoke update on public.usuario from anon, authenticated;

grant update (calle, num_ext, num_int, colonia, cp, municipio, estado)
  on public.usuario to authenticated;

-- Quedan NO editables: nombre, apellidos, correo, rfc, nacimiento, id_rol.
