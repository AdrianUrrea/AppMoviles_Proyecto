import { supabase } from '@/lib/supabase';
import { esErrorDeRed } from '@/lib/errores';
import { logDev } from '@/lib/log';
import { withTimeout } from '@/lib/timeout';
import { filaARecordatorio } from '@/recordatorios/logica';
import type { FilaRecordatorio, Recordatorio } from '@/recordatorios/logica';
import { RECORDATORIO_MESSAGES } from '@/validation/mensajes';
import type { RecordatorioErrorCode } from '@/validation/mensajes';

const COLUMNAS = 'id_recordatorio, titulo, fecha_hora';
const TIEMPO_LIMITE_MS = 20_000;

export class RecordatorioError extends Error {
  constructor(public readonly code: RecordatorioErrorCode) {
    super(RECORDATORIO_MESSAGES[code]);
    this.name = 'RecordatorioError';
  }
}

export function getRecordatorioErrorMessage(error: unknown): string {
  return error instanceof RecordatorioError ? error.message : RECORDATORIO_MESSAGES.UNKNOWN;
}

const limite = <T,>(llamada: PromiseLike<T>): Promise<T> =>
  withTimeout(llamada, TIEMPO_LIMITE_MS, () => new RecordatorioError('NETWORK'));

function aRecordatorioError(error: unknown): RecordatorioError {
  if (error instanceof RecordatorioError) return error;
  logDev('recordatorios', error);
  if (esErrorDeRed(error)) return new RecordatorioError('NETWORK');
  // 42501: la politica RLS rechazo el insert (fecha pasada o dueno distinto).
  if ((error as { code?: string } | null)?.code === '42501') return new RecordatorioError('FECHA_PASADA');
  return new RecordatorioError('UNKNOWN');
}

/** Recordatorios con fecha en [desde, hasta). Las politicas RLS limitan el resultado al usuario actual. */
export async function listarRecordatorios(desde: Date, hasta: Date): Promise<Recordatorio[]> {
  try {
    const { data, error } = await limite(
      supabase
        .from('recordatorio')
        .select(COLUMNAS)
        .gte('fecha_hora', desde.toISOString())
        .lt('fecha_hora', hasta.toISOString())
        .order('fecha_hora', { ascending: true }),
    );
    if (error) throw error;
    return ((data as FilaRecordatorio[] | null) ?? []).map(filaARecordatorio);
  } catch (e) {
    throw aRecordatorioError(e);
  }
}

/** Proximos recordatorios (para programar los avisos del telefono). */
export async function listarFuturos(desde: Date, maximo = 200): Promise<Recordatorio[]> {
  try {
    const { data, error } = await limite(
      supabase
        .from('recordatorio')
        .select(COLUMNAS)
        .gt('fecha_hora', desde.toISOString())
        .order('fecha_hora', { ascending: true })
        .limit(maximo),
    );
    if (error) throw error;
    return ((data as FilaRecordatorio[] | null) ?? []).map(filaARecordatorio);
  } catch (e) {
    throw aRecordatorioError(e);
  }
}

export async function crearRecordatorio(titulo: string, fechaHora: Date): Promise<Recordatorio> {
  try {
    // id_user lo asigna la base de datos (auth.uid()).
    const { data, error } = await limite(
      supabase
        .from('recordatorio')
        .insert({ titulo, fecha_hora: fechaHora.toISOString() })
        .select(COLUMNAS)
        .single(),
    );
    if (error) throw error;
    return filaARecordatorio(data as FilaRecordatorio);
  } catch (e) {
    throw aRecordatorioError(e);
  }
}

/** Idempotente: eliminar algo que ya no existe no es un error. */
export async function eliminarRecordatorio(id: string): Promise<void> {
  try {
    const { error } = await limite(supabase.from('recordatorio').delete().eq('id_recordatorio', id));
    if (error) throw error;
  } catch (e) {
    throw aRecordatorioError(e);
  }
}
