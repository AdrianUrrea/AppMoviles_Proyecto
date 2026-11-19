import { esErrorDeRed } from '@/lib/errores';
import { logDev } from '@/lib/log';
import { supabase } from '@/lib/supabase';
import { withTimeout } from '@/lib/timeout';
import type { DomicilioActualizacion } from '@/perfil/logica';
import type { FilaPerfil } from '@/tramites/logica';
import { PERFIL_MESSAGES } from '@/validation/mensajes';
import type { PerfilErrorCode } from '@/validation/mensajes';

const COLUMNAS =
  'nombre, apellido_paterno, apellido_materno, correo, rfc, nacimiento, calle, num_ext, num_int, colonia, cp, municipio, estado';
const TIEMPO_LIMITE_MS = 20_000;

export class PerfilError extends Error {
  constructor(public readonly code: PerfilErrorCode) {
    super(PERFIL_MESSAGES[code]);
    this.name = 'PerfilError';
  }
}

export function getPerfilErrorMessage(error: unknown): string {
  return error instanceof PerfilError ? error.message : PERFIL_MESSAGES.UNKNOWN;
}

/** Datos completos del usuario actual. Las politicas RLS garantizan que solo devuelve SU fila. null si no existe. */
export async function obtenerPerfilCompleto(): Promise<FilaPerfil | null> {
  try {
    const { data, error } = await withTimeout(
      supabase.from('usuario').select(COLUMNAS).maybeSingle(),
      TIEMPO_LIMITE_MS,
      () => new PerfilError('NETWORK'),
    );
    if (error) throw error;
    return (data as FilaPerfil | null) ?? null;
  } catch (e) {
    if (e instanceof PerfilError) throw e;
    logDev('perfil', e);
    throw new PerfilError(esErrorDeRed(e) ? 'NETWORK' : 'UNKNOWN');
  }
}

/**
 * Guarda el domicilio del usuario. La base de datos solo permite editar estas columnas (ver supabase/003): aunque
 * la app enviara otras, el servidor las rechazaria. Devuelve el perfil ya actualizado.
 */
export async function actualizarDomicilio(userId: string, cambios: DomicilioActualizacion): Promise<FilaPerfil> {
  try {
    const { data, error } = await withTimeout(
      supabase.from('usuario').update(cambios).eq('id_user', userId).select(COLUMNAS).maybeSingle(),
      TIEMPO_LIMITE_MS,
      () => new PerfilError('NETWORK'),
    );
    if (error) throw error;
    if (!data) throw new PerfilError('GUARDAR'); // ninguna fila actualizada: no era suya o no existe
    return data as FilaPerfil;
  } catch (e) {
    if (e instanceof PerfilError) throw e;
    logDev('perfil-guardar', e);
    throw new PerfilError(esErrorDeRed(e) ? 'NETWORK' : 'GUARDAR');
  }
}
