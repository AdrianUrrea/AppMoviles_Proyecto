import { CLAVE_VALIDA } from '@/dinero/formularios';
import type { Valores } from '@/dinero/formularios';
import { esErrorDeRed } from '@/lib/errores';
import { logDev } from '@/lib/log';
import { supabase } from '@/lib/supabase';
import { withTimeout } from '@/lib/timeout';
import { DINERO_MESSAGES } from '@/validation/mensajes';
import type { DineroErrorCode } from '@/validation/mensajes';

const TIEMPO_LIMITE_MS = 20_000;

export class DineroError extends Error {
  constructor(public readonly code: DineroErrorCode) {
    super(DINERO_MESSAGES[code]);
    this.name = 'DineroError';
  }
}

export function getDineroErrorMessage(error: unknown): string {
  return error instanceof DineroError ? error.message : DINERO_MESSAGES.UNKNOWN;
}

const limite = <T,>(llamada: PromiseLike<T>): Promise<T> =>
  withTimeout(llamada, TIEMPO_LIMITE_MS, () => new DineroError('NETWORK'));

function aDineroError(error: unknown): DineroError {
  if (error instanceof DineroError) return error;
  logDev('datos-dinero', error);
  return new DineroError(esErrorDeRed(error) ? 'NETWORK' : 'UNKNOWN');
}

function exigirClave(clave: string): void {
  if (!CLAVE_VALIDA.test(clave)) throw new DineroError('UNKNOWN');
}

/** Datos guardados bajo esa clave (sin sanear), o null si aun no hay. Las politicas RLS limitan el acceso a las del usuario. */
export async function obtenerCaptura(clave: string): Promise<unknown | null> {
  try {
    exigirClave(clave);
    const { data, error } = await limite(
      supabase.from('captura_financiera').select('datos').eq('clave', clave).maybeSingle(),
    );
    if (error) throw error;
    return (data as { datos?: unknown } | null)?.datos ?? null;
  } catch (e) {
    throw aDineroError(e);
  }
}

/** Crea o actualiza (una fila por usuario y clave). */
export async function guardarCaptura(clave: string, datos: Valores): Promise<void> {
  try {
    exigirClave(clave);
    // id_user lo asigna la base de datos (auth.uid()).
    const { error } = await limite(
      supabase.from('captura_financiera').upsert({ clave, datos }, { onConflict: 'id_user,clave' }),
    );
    if (error) throw error;
  } catch (e) {
    throw aDineroError(e);
  }
}
